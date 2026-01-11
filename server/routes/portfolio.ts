import { Router, Request, Response } from 'express';
import {
  db,
  portfolioInvestments,
  investments,
  transactions,
  paymentMethods,
} from '../db/index';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All portfolio routes require authentication
router.use(authMiddleware);

/**
 * GET /api/portfolio/summary
 * Get portfolio summary with totals
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all user's portfolio investments
    const userInvestments = await db
      .select({
        amountInvested: portfolioInvestments.amountInvested,
        currentValue: portfolioInvestments.currentValue,
        status: portfolioInvestments.status,
      })
      .from(portfolioInvestments)
      .where(eq(portfolioInvestments.userId, userId));

    // Calculate totals
    let totalInvested = 0;
    let totalValue = 0;
    let activeCount = 0;
    let completedCount = 0;
    let pendingCount = 0;

    for (const inv of userInvestments) {
      const invested = parseFloat(inv.amountInvested);
      const current = parseFloat(inv.currentValue);
      
      totalInvested += invested;
      totalValue += current;

      switch (inv.status) {
        case 'active':
          activeCount++;
          break;
        case 'completed':
          completedCount++;
          break;
        case 'pending':
          pendingCount++;
          break;
      }
    }

    const totalGainLoss = totalValue - totalInvested;
    const gainLossPercent = totalInvested > 0
      ? (totalGainLoss / totalInvested) * 100
      : 0;

    res.json({
      totalValue,
      totalInvested,
      totalGainLoss,
      gainLossPercent: Math.round(gainLossPercent * 100) / 100,
      activeInvestments: activeCount,
      completedInvestments: completedCount,
      pendingInvestments: pendingCount,
    });
  } catch (error) {
    console.error('Get portfolio summary error:', error);
    res.status(500).json({ message: 'Failed to fetch portfolio summary' });
  }
});

/**
 * GET /api/portfolio/investments
 * Get user's investments with pagination
 */
router.get('/investments', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '20', status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    // Build conditions
    const conditions = [eq(portfolioInvestments.userId, userId)];
    
    if (status) {
      conditions.push(eq(portfolioInvestments.status, status as any));
    }

    const whereClause = and(...conditions);

    // Fetch investments with investment details
    const [userInvestments, [countResult]] = await Promise.all([
      db
        .select({
          id: portfolioInvestments.id,
          investmentId: portfolioInvestments.investmentId,
          amountInvested: portfolioInvestments.amountInvested,
          currentValue: portfolioInvestments.currentValue,
          status: portfolioInvestments.status,
          investedAt: portfolioInvestments.investedAt,
          name: investments.name,
          category: investments.category,
          imageUrl: investments.imageUrl,
        })
        .from(portfolioInvestments)
        .innerJoin(investments, eq(portfolioInvestments.investmentId, investments.id))
        .where(whereClause)
        .orderBy(desc(portfolioInvestments.investedAt))
        .limit(limitNum)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(portfolioInvestments)
        .where(whereClause),
    ]);

    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);

    // Format response
    const data = userInvestments.map((inv) => {
      const amountInvested = parseFloat(inv.amountInvested);
      const currentValue = parseFloat(inv.currentValue);
      const gainLossPercent = amountInvested > 0
        ? ((currentValue - amountInvested) / amountInvested) * 100
        : 0;

      return {
        id: inv.id,
        investmentId: inv.investmentId,
        name: inv.name,
        category: inv.category,
        imageUrl: inv.imageUrl,
        amountInvested,
        currentValue,
        gainLossPercent: Math.round(gainLossPercent * 100) / 100,
        status: inv.status,
        investedAt: inv.investedAt,
      };
    });

    res.json({
      data,
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
      hasMore: pageNum < totalPages,
    });
  } catch (error) {
    console.error('Get portfolio investments error:', error);
    res.status(500).json({ message: 'Failed to fetch portfolio investments' });
  }
});

/**
 * POST /api/portfolio/invest
 * Create new investment
 */
router.post('/invest', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { investmentId, amount, paymentMethodId } = req.body;

    // Validate input
    if (!investmentId || !amount || !paymentMethodId) {
      res.status(400).json({ 
        message: 'Investment ID, amount, and payment method are required' 
      });
      return;
    }

    const investmentAmount = parseFloat(amount);
    
    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      res.status(400).json({ message: 'Invalid investment amount' });
      return;
    }

    // Check investment exists and is active
    const [investment] = await db
      .select()
      .from(investments)
      .where(eq(investments.id, investmentId))
      .limit(1);

    if (!investment) {
      res.status(404).json({ message: 'Investment not found' });
      return;
    }

    if (investment.status !== 'active') {
      res.status(400).json({ message: 'Investment is not currently accepting funds' });
      return;
    }

    // Check minimum investment
    const minimumInvestment = parseFloat(investment.minimumInvestment);
    if (investmentAmount < minimumInvestment) {
      res.status(400).json({ 
        message: `Minimum investment is $${minimumInvestment.toLocaleString()}` 
      });
      return;
    }

    // Check payment method belongs to user
    const [paymentMethod] = await db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.id, paymentMethodId),
          eq(paymentMethods.userId, userId)
        )
      )
      .limit(1);

    if (!paymentMethod) {
      res.status(404).json({ message: 'Payment method not found' });
      return;
    }

    // Check if user already has an investment in this opportunity
    const [existingInvestment] = await db
      .select()
      .from(portfolioInvestments)
      .where(
        and(
          eq(portfolioInvestments.userId, userId),
          eq(portfolioInvestments.investmentId, investmentId)
        )
      )
      .limit(1);

    let portfolioInvestment;

    if (existingInvestment) {
      // Update existing investment
      const newAmount = parseFloat(existingInvestment.amountInvested) + investmentAmount;
      
      [portfolioInvestment] = await db
        .update(portfolioInvestments)
        .set({
          amountInvested: newAmount.toString(),
          currentValue: newAmount.toString(), // Initially same as invested
          updatedAt: new Date(),
        })
        .where(eq(portfolioInvestments.id, existingInvestment.id))
        .returning();
    } else {
      // Create new portfolio investment
      [portfolioInvestment] = await db
        .insert(portfolioInvestments)
        .values({
          userId,
          investmentId,
          amountInvested: investmentAmount.toString(),
          currentValue: investmentAmount.toString(),
          status: 'pending',
        })
        .returning();
    }

    // Create transaction record
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        portfolioInvestmentId: portfolioInvestment.id,
        type: 'investment',
        amount: investmentAmount.toString(),
        status: 'pending',
        paymentMethodId,
      })
      .returning();

    // Update investment funding and investor count
    await db
      .update(investments)
      .set({
        fundingCurrent: sql`${investments.fundingCurrent} + ${investmentAmount}`,
        investorCount: existingInvestment 
          ? investments.investorCount 
          : sql`${investments.investorCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(investments.id, investmentId));

    res.status(201).json({
      message: 'Investment submitted successfully',
      portfolioInvestment: {
        id: portfolioInvestment.id,
        investmentId: portfolioInvestment.investmentId,
        amountInvested: parseFloat(portfolioInvestment.amountInvested),
        status: portfolioInvestment.status,
      },
      transaction: {
        id: transaction.id,
        amount: parseFloat(transaction.amount),
        status: transaction.status,
      },
    });
  } catch (error) {
    console.error('Create investment error:', error);
    res.status(500).json({ message: 'Failed to process investment' });
  }
});

/**
 * GET /api/portfolio/transactions
 * Get user's transaction history
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '20', type } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    // Build conditions
    const conditions = [eq(transactions.userId, userId)];
    
    if (type) {
      conditions.push(eq(transactions.type, type as any));
    }

    const whereClause = and(...conditions);

    // Fetch transactions with investment details
    const [userTransactions, [countResult]] = await Promise.all([
      db
        .select({
          id: transactions.id,
          type: transactions.type,
          amount: transactions.amount,
          status: transactions.status,
          createdAt: transactions.createdAt,
          completedAt: transactions.completedAt,
          investmentName: investments.name,
        })
        .from(transactions)
        .leftJoin(
          portfolioInvestments,
          eq(transactions.portfolioInvestmentId, portfolioInvestments.id)
        )
        .leftJoin(investments, eq(portfolioInvestments.investmentId, investments.id))
        .where(whereClause)
        .orderBy(desc(transactions.createdAt))
        .limit(limitNum)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(whereClause),
    ]);

    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      data: userTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        status: t.status,
        investmentName: t.investmentName,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
      })),
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
      hasMore: pageNum < totalPages,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

export default router;
