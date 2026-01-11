import { Router, Request, Response } from 'express';
import { db, users, userSessions, notificationPreferences } from '../db/index';
import { eq } from 'drizzle-orm';
import { authMiddleware, generateToken } from '../middleware/auth';
import { verifyAppleToken, verifyGoogleToken } from '../services/socialAuth';

const router = Router();

/**
 * POST /api/auth/social
 * Social sign in (Apple/Google)
 */
router.post('/social', async (req: Request, res: Response) => {
  try {
    const { provider, token, email, firstName, lastName, avatarUrl, identityToken } = req.body;

    if (!provider || !token) {
      res.status(400).json({ message: 'Provider and token are required' });
      return;
    }

    let verifiedEmail: string | undefined;
    let providerUserId: string | undefined;

    // Verify token based on provider
    if (provider === 'apple') {
      const appleData = await verifyAppleToken(identityToken || token);
      if (!appleData) {
        res.status(401).json({ message: 'Invalid Apple token' });
        return;
      }
      verifiedEmail = appleData.email || email;
      providerUserId = appleData.sub;
    } else if (provider === 'google') {
      const googleData = await verifyGoogleToken(token);
      if (!googleData) {
        res.status(401).json({ message: 'Invalid Google token' });
        return;
      }
      verifiedEmail = googleData.email || email;
      providerUserId = googleData.sub;
    } else {
      res.status(400).json({ message: 'Invalid provider' });
      return;
    }

    if (!verifiedEmail) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    // Check if user exists
    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, verifiedEmail))
      .limit(1);

    let userId: string;

    if (existingUser) {
      // Update existing user
      userId = existingUser.id;
      
      await db
        .update(users)
        .set({
          provider,
          providerUserId,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
          // Only update name/avatar if not already set
          ...(firstName && !existingUser.firstName ? { firstName } : {}),
          ...(lastName && !existingUser.lastName ? { lastName } : {}),
          ...(avatarUrl && !existingUser.avatarUrl ? { avatarUrl } : {}),
        })
        .where(eq(users.id, userId));
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          email: verifiedEmail,
          firstName,
          lastName,
          avatarUrl,
          provider,
          providerUserId,
          isVerified: true, // Social auth users are auto-verified
          lastLoginAt: new Date(),
        })
        .returning();

      userId = newUser.id;

      // Create default notification preferences
      await db.insert(notificationPreferences).values({
        userId,
      });
    }

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const [session] = await db
      .insert(userSessions)
      .values({
        userId,
        token: crypto.randomUUID(),
        expiresAt,
      })
      .returning();

    // Generate JWT
    const jwtToken = generateToken(userId, session.id);

    // Fetch user data
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarUrl: users.avatarUrl,
        provider: users.provider,
        isVerified: users.isVerified,
        isAccredited: users.isAccredited,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    res.json({
      token: jwtToken,
      user: {
        ...user,
        fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
      },
    });
  } catch (error) {
    console.error('Social auth error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
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
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

/**
 * PATCH /api/auth/me
 * Update current user profile
 */
router.patch('/me', authMiddleware, async (req: Request, res: Response) => {
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
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

/**
 * POST /api/auth/logout
 * Logout current session
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Delete current session
    await db
      .delete(userSessions)
      .where(eq(userSessions.token, req.token!));

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

/**
 * POST /api/auth/logout-all
 * Logout all sessions
 */
router.post('/logout-all', authMiddleware, async (req: Request, res: Response) => {
  try {
    await db
      .delete(userSessions)
      .where(eq(userSessions.userId, req.user!.id));

    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

export default router;
