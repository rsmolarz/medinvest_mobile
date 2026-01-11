import { Router, Request, Response } from 'express';
import { db, users, pushTokens, notificationPreferences, paymentMethods } from '../db';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: './uploads/avatars',
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${req.user!.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        provider: users.provider,
        isVerified: users.isVerified,
        isAccredited: users.isAccredited,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, req.user!.id))
      .limit(1);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      ...user,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

/**
 * PATCH /api/users/me
 * Update current user profile
 */
router.patch('/me', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const [updatedUser] = await db
      .update(users)
      .set({
        firstName,
        lastName,
        phone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user!.id))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        provider: users.provider,
        isVerified: users.isVerified,
        isAccredited: users.isAccredited,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    res.json({
      ...updatedUser,
      fullName: [updatedUser.firstName, updatedUser.lastName]
        .filter(Boolean)
        .join(' ') || undefined,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

/**
 * POST /api/users/me/avatar
 * Upload user avatar
 */
router.post('/me/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // Get current avatar to delete old file
    const [currentUser] = await db
      .select({ avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, req.user!.id))
      .limit(1);

    // Delete old avatar file if exists
    if (currentUser?.avatarUrl && currentUser.avatarUrl.startsWith('/uploads/')) {
      try {
        await fs.unlink(`.${currentUser.avatarUrl}`);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    // Update user with new avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const [updatedUser] = await db
      .update(users)
      .set({
        avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user!.id))
      .returning({ avatarUrl: users.avatarUrl });

    res.json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

/**
 * POST /api/users/me/push-token
 * Register push notification token
 */
router.post('/me/push-token', async (req: Request, res: Response) => {
  try {
    const { token, platform } = req.body;

    if (!token) {
      res.status(400).json({ message: 'Token is required' });
      return;
    }

    // Check if token already exists
    const [existingToken] = await db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.token, token))
      .limit(1);

    if (existingToken) {
      // Update user ID if different
      if (existingToken.userId !== req.user!.id) {
        await db
          .update(pushTokens)
          .set({ userId: req.user!.id })
          .where(eq(pushTokens.id, existingToken.id));
      }
    } else {
      // Create new token
      await db.insert(pushTokens).values({
        userId: req.user!.id,
        token,
        platform,
      });
    }

    res.json({ message: 'Push token registered' });
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({ message: 'Failed to register push token' });
  }
});

/**
 * DELETE /api/users/me/push-token
 * Unregister push notification token
 */
router.delete('/me/push-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ message: 'Token is required' });
      return;
    }

    await db
      .delete(pushTokens)
      .where(
        and(
          eq(pushTokens.userId, req.user!.id),
          eq(pushTokens.token, token)
        )
      );

    res.json({ message: 'Push token unregistered' });
  } catch (error) {
    console.error('Unregister push token error:', error);
    res.status(500).json({ message: 'Failed to unregister push token' });
  }
});

/**
 * GET /api/users/me/notification-preferences
 * Get notification preferences
 */
router.get('/me/notification-preferences', async (req: Request, res: Response) => {
  try {
    let [prefs] = await db
      .select({
        investmentUpdates: notificationPreferences.investmentUpdates,
        newOpportunities: notificationPreferences.newOpportunities,
        portfolioMilestones: notificationPreferences.portfolioMilestones,
        articles: notificationPreferences.articles,
        marketing: notificationPreferences.marketing,
      })
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, req.user!.id))
      .limit(1);

    // Create default preferences if not exists
    if (!prefs) {
      [prefs] = await db
        .insert(notificationPreferences)
        .values({ userId: req.user!.id })
        .returning({
          investmentUpdates: notificationPreferences.investmentUpdates,
          newOpportunities: notificationPreferences.newOpportunities,
          portfolioMilestones: notificationPreferences.portfolioMilestones,
          articles: notificationPreferences.articles,
          marketing: notificationPreferences.marketing,
        });
    }

    res.json(prefs);
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ message: 'Failed to fetch notification preferences' });
  }
});

/**
 * PATCH /api/users/me/notification-preferences
 * Update notification preferences
 */
router.patch('/me/notification-preferences', async (req: Request, res: Response) => {
  try {
    const {
      investmentUpdates,
      newOpportunities,
      portfolioMilestones,
      articles,
      marketing,
    } = req.body;

    // Build update object with only provided fields
    const updateData: Record<string, any> = { updatedAt: new Date() };
    
    if (investmentUpdates !== undefined) updateData.investmentUpdates = investmentUpdates;
    if (newOpportunities !== undefined) updateData.newOpportunities = newOpportunities;
    if (portfolioMilestones !== undefined) updateData.portfolioMilestones = portfolioMilestones;
    if (articles !== undefined) updateData.articles = articles;
    if (marketing !== undefined) updateData.marketing = marketing;

    // Check if preferences exist
    const [existing] = await db
      .select({ id: notificationPreferences.id })
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, req.user!.id))
      .limit(1);

    let prefs;

    if (existing) {
      [prefs] = await db
        .update(notificationPreferences)
        .set(updateData)
        .where(eq(notificationPreferences.userId, req.user!.id))
        .returning({
          investmentUpdates: notificationPreferences.investmentUpdates,
          newOpportunities: notificationPreferences.newOpportunities,
          portfolioMilestones: notificationPreferences.portfolioMilestones,
          articles: notificationPreferences.articles,
          marketing: notificationPreferences.marketing,
        });
    } else {
      [prefs] = await db
        .insert(notificationPreferences)
        .values({
          userId: req.user!.id,
          ...updateData,
        })
        .returning({
          investmentUpdates: notificationPreferences.investmentUpdates,
          newOpportunities: notificationPreferences.newOpportunities,
          portfolioMilestones: notificationPreferences.portfolioMilestones,
          articles: notificationPreferences.articles,
          marketing: notificationPreferences.marketing,
        });
    }

    res.json(prefs);
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ message: 'Failed to update notification preferences' });
  }
});

/**
 * GET /api/users/me/payment-methods
 * Get user's payment methods
 */
router.get('/me/payment-methods', async (req: Request, res: Response) => {
  try {
    const methods = await db
      .select({
        id: paymentMethods.id,
        type: paymentMethods.type,
        name: paymentMethods.name,
        last4: paymentMethods.last4,
        expiryMonth: paymentMethods.expiryMonth,
        expiryYear: paymentMethods.expiryYear,
        bankName: paymentMethods.bankName,
        isDefault: paymentMethods.isDefault,
      })
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, req.user!.id));

    res.json(methods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods' });
  }
});

export default router;
