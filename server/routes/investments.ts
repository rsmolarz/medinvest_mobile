import { Router, Request, Response } from 'express';
import {
  db,
  investments,
  investmentDocuments,
  investmentTeamMembers,
  investmentMilestones,
} from '../db/index';
import { eq, and, or, gte, lte, like, desc, asc, sql, ilike } from 'drizzle-orm';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Helper to calculate days remaining
 */
function calculateDaysRemaining(endDate: Date): number {
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Helper to format investment response
 */
function formatInvestment(inv: any) {
  return {
    id: inv.id,
    name: inv.name,
    description: inv.description,
    longDescription: inv.longDescription,
    category: inv.category,
    fundingGoal: parseFloat(inv.fundingGoal),
    fundingCurrent: parseFloat(inv.fundingCurrent),
    minimumInvestment: parseFloat(inv.minimumInvestment),
    expectedROI: inv.expectedRoiMin && inv.expectedRoiMax
      ? `${inv.expectedRoiMin}-${inv.expectedRoiMax}%`
      : inv.expectedRoiMin
      ? `${inv.expectedRoiMin}%+`
      : 'TBD',
    riskLevel: inv.riskLevel,
    status: inv.status,
    imageUrl: inv.imageUrl,
    daysRemaining: calculateDaysRemaining(new Date(inv.endDate)),
    startDate: inv.startDate,
    endDate: inv.endDate,
    investors: inv.investorCount,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
  };
}

/**
 * GET /api/investments
 * List investments with filters and pagination
 */
router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      category,
      riskLevel,
      status = 'active',
      minInvestment,
      maxInvestment,
      sortBy = 'newest',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(investments.status, status as any));
    }

    if (category) {
      conditions.push(eq(investments.category, category as any));
    }

    if (riskLevel) {
      conditions.push(eq(investments.riskLevel, riskLevel as any));
    }

    if (minInvestment) {
      conditions.push(gte(investments.minimumInvestment, minInvestment as string));
    }

    if (maxInvestment) {
      conditions.push(lte(investments.minimumInvestment, maxInvestment as string));
    }

    // Build order by
    let orderBy;
    switch (sortBy) {
      case 'endingSoon':
        orderBy = asc(investments.endDate);
        break;
      case 'mostFunded':
        orderBy = desc(investments.fundingCurrent);
        break;
      case 'highestROI':
        orderBy = desc(investments.expectedRoiMax);
        break;
      case 'newest':
      default:
        orderBy = desc(investments.createdAt);
    }

    // Execute queries
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [investmentsList, [countResult]] = await Promise.all([
      db
        .select()
        .from(investments)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limitNum)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(investments)
        .where(whereClause),
    ]);

    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      data: investmentsList.map(formatInvestment),
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
      hasMore: pageNum < totalPages,
    });
  } catch (error) {
    console.error('List investments error:', error);
    res.status(500).json({ message: 'Failed to fetch investments' });
  }
});

/**
 * GET /api/investments/search
 * Search investments
 */
router.get('/search', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      q = '',
      page = '1',
      limit = '10',
      category,
      riskLevel,
    } = req.query;

    const searchQuery = (q as string).trim();
    
    if (searchQuery.length < 2) {
      res.json({
        data: [],
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasMore: false,
      });
      return;
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    // Build conditions
    const conditions = [
      eq(investments.status, 'active'),
      or(
        ilike(investments.name, `%${searchQuery}%`),
        ilike(investments.description, `%${searchQuery}%`)
      ),
    ];

    if (category) {
      conditions.push(eq(investments.category, category as any));
    }

    if (riskLevel) {
      conditions.push(eq(investments.riskLevel, riskLevel as any));
    }

    const whereClause = and(...conditions);

    const [investmentsList, [countResult]] = await Promise.all([
      db
        .select()
        .from(investments)
        .where(whereClause)
        .orderBy(desc(investments.createdAt))
        .limit(limitNum)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(investments)
        .where(whereClause),
    ]);

    const totalItems = countResult?.count || 0;
    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      data: investmentsList.map(formatInvestment),
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
      hasMore: pageNum < totalPages,
    });
  } catch (error) {
    console.error('Search investments error:', error);
    res.status(500).json({ message: 'Failed to search investments' });
  }
});

/**
 * GET /api/investments/:id
 * Get investment detail
 */
router.get('/:id', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch investment with related data
    const [investment] = await db
      .select()
      .from(investments)
      .where(eq(investments.id, id))
      .limit(1);

    if (!investment) {
      res.status(404).json({ message: 'Investment not found' });
      return;
    }

    // Fetch related data
    const [documents, teamMembers, milestones] = await Promise.all([
      db
        .select()
        .from(investmentDocuments)
        .where(eq(investmentDocuments.investmentId, id)),
      db
        .select()
        .from(investmentTeamMembers)
        .where(eq(investmentTeamMembers.investmentId, id))
        .orderBy(investmentTeamMembers.sortOrder),
      db
        .select()
        .from(investmentMilestones)
        .where(eq(investmentMilestones.investmentId, id))
        .orderBy(investmentMilestones.sortOrder),
    ]);

    res.json({
      ...formatInvestment(investment),
      documents: documents.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        url: d.url,
      })),
      team: teamMembers.map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        avatarUrl: t.avatarUrl,
        linkedInUrl: t.linkedInUrl,
      })),
      milestones: milestones.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        targetDate: m.targetDate,
        completed: m.completed,
        completedAt: m.completedAt,
      })),
    });
  } catch (error) {
    console.error('Get investment error:', error);
    res.status(500).json({ message: 'Failed to fetch investment' });
  }
});

/**
 * GET /api/investments/categories/stats
 * Get investment counts by category
 */
router.get('/categories/stats', async (req: Request, res: Response) => {
  try {
    const stats = await db
      .select({
        category: investments.category,
        count: sql<number>`count(*)::int`,
      })
      .from(investments)
      .where(eq(investments.status, 'active'))
      .groupBy(investments.category);

    res.json(stats);
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ message: 'Failed to fetch category stats' });
  }
});

export default router;
