import { Router, Request, Response } from 'express';
import { db, users, userSessions, notificationPreferences } from '../db';
import { eq } from 'drizzle-orm';
import { authMiddleware, generateToken } from '../middleware/auth';
import { verifyAppleToken, verifyGoogleToken, verifyGithubToken, verifyFacebookToken } from '../services/socialAuth';
import bcrypt from 'bcrypt';

const router = Router();

/**
 * POST /api/auth/register
 * Email/password registration
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    if (!first_name || !last_name) {
      res.status(400).json({ message: 'First and last name are required' });
      return;
    }

    // Password validation
    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' });
      return;
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      res.status(400).json({ 
        message: 'Password must contain uppercase, lowercase, and number' 
      });
      return;
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      res.status(409).json({ message: 'An account with this email already exists' });
      return;
    }

    // Hash password with bcrypt (10 salt rounds)
    const SALT_ROUNDS = 10;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create new user with hashed password
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        firstName: first_name,
        lastName: last_name,
        provider: 'email',
        isVerified: false,
        lastLoginAt: new Date(),
      })
      .returning();

    // Create default notification preferences
    await db.insert(notificationPreferences).values({
      userId: newUser.id,
    });

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const [session] = await db
      .insert(userSessions)
      .values({
        userId: newUser.id,
        token: crypto.randomUUID(),
        expiresAt,
      })
      .returning();

    // Generate JWT
    const jwtToken = generateToken(newUser.id, session.id);

    res.status(201).json({
      token: jwtToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        isVerified: newUser.isVerified,
        fullName: [newUser.firstName, newUser.lastName].filter(Boolean).join(' '),
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Email/password login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user || !user.passwordHash) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const [session] = await db
      .insert(userSessions)
      .values({
        userId: user.id,
        token: crypto.randomUUID(),
        expiresAt,
      })
      .returning();

    // Generate JWT
    const jwtToken = generateToken(user.id, session.id);

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

/**
 * POST /api/auth/github/token
 * Exchange GitHub authorization code for access token
 * Supports both web and mobile OAuth apps
 */
router.post('/github/token', async (req: Request, res: Response) => {
  try {
    const { code, redirect_uri, platform } = req.body;

    if (!code) {
      res.status(400).json({ message: 'Authorization code is required' });
      return;
    }

    // Use platform-specific credentials
    // Mobile app uses separate OAuth app with different redirect URI
    const isMobile = platform === 'mobile' || platform === 'ios' || platform === 'android';
    
    let clientId: string | undefined;
    let clientSecret: string | undefined;
    
    if (isMobile) {
      // Mobile OAuth credentials
      clientId = process.env.GITHUB_MOBILE_CLIENT_ID || process.env.EXPO_PUBLIC_GITHUB_MOBILE_CLIENT_ID;
      clientSecret = process.env.GITHUB_MOBILE_CLIENT_SECRET;
      
      // Fall back to web credentials if mobile not configured
      if (!clientId || !clientSecret) {
        console.log('Mobile GitHub credentials not found, falling back to web credentials');
        clientId = process.env.GITHUB_CLIENT_ID || process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
        clientSecret = process.env.GITHUB_CLIENT_SECRET;
      }
    } else {
      // Web OAuth credentials
      clientId = process.env.GITHUB_CLIENT_ID || process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
      clientSecret = process.env.GITHUB_CLIENT_SECRET;
    }

    if (!clientId || !clientSecret) {
      res.status(500).json({ message: 'GitHub OAuth is not configured' });
      return;
    }

    console.log(`GitHub token exchange: platform=${platform}, isMobile=${isMobile}`);

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub token exchange error:', tokenData);
      res.status(401).json({ message: tokenData.error_description || 'Failed to exchange code' });
      return;
    }

    res.json({ access_token: tokenData.access_token });
  } catch (error) {
    console.error('GitHub token exchange error:', error);
    res.status(500).json({ message: 'Token exchange failed' });
  }
});

/**
 * POST /api/auth/facebook/token
 * Exchange Facebook authorization code for access token
 */
router.post('/facebook/token', async (req: Request, res: Response) => {
  try {
    const { code, redirect_uri } = req.body;

    if (!code) {
      res.status(400).json({ message: 'Authorization code is required' });
      return;
    }

    // Use server-side env vars
    const appId = process.env.FACEBOOK_APP_ID || process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      res.status(500).json({ message: 'Facebook OAuth is not configured' });
      return;
    }

    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.append('client_id', appId);
    tokenUrl.searchParams.append('client_secret', appSecret);
    tokenUrl.searchParams.append('redirect_uri', redirect_uri);
    tokenUrl.searchParams.append('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Facebook token exchange error:', tokenData);
      res.status(401).json({ message: tokenData.error.message || 'Failed to exchange code' });
      return;
    }

    res.json({ access_token: tokenData.access_token });
  } catch (error) {
    console.error('Facebook token exchange error:', error);
    res.status(500).json({ message: 'Token exchange failed' });
  }
});

/**
 * POST /api/auth/social
 * Social sign in (Apple/Google/GitHub/Facebook)
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
    let verifiedFirstName: string | undefined;
    let verifiedLastName: string | undefined;
    let verifiedAvatarUrl: string | undefined;

    // Verify token based on provider
    if (provider === 'apple') {
      const appleData = await verifyAppleToken(identityToken || token);
      if (!appleData) {
        res.status(401).json({ message: 'Invalid Apple token' });
        return;
      }
      verifiedEmail = appleData.email || email;
      providerUserId = appleData.sub;
      // Apple doesn't provide avatar, use client-provided values
      verifiedFirstName = firstName;
      verifiedLastName = lastName;
      verifiedAvatarUrl = avatarUrl;
    } else if (provider === 'google') {
      const googleData = await verifyGoogleToken(token);
      if (!googleData) {
        res.status(401).json({ message: 'Invalid Google token' });
        return;
      }
      verifiedEmail = googleData.email || email;
      providerUserId = googleData.sub;
      verifiedFirstName = googleData.given_name || firstName;
      verifiedLastName = googleData.family_name || lastName;
      verifiedAvatarUrl = googleData.picture || avatarUrl;
    } else if (provider === 'github') {
      const githubData = await verifyGithubToken(token);
      if (!githubData) {
        res.status(401).json({ message: 'Invalid GitHub token' });
        return;
      }
      verifiedEmail = githubData.email || email;
      providerUserId = githubData.sub;
      // GitHub provides full name, try to split it
      if (githubData.name) {
        const nameParts = githubData.name.split(' ');
        verifiedFirstName = nameParts[0] || firstName;
        verifiedLastName = nameParts.slice(1).join(' ') || lastName;
      } else {
        verifiedFirstName = firstName;
        verifiedLastName = lastName;
      }
      verifiedAvatarUrl = githubData.picture || avatarUrl;
    } else if (provider === 'facebook') {
      const facebookData = await verifyFacebookToken(token);
      if (!facebookData) {
        res.status(401).json({ message: 'Invalid Facebook token' });
        return;
      }
      verifiedEmail = facebookData.email || email;
      providerUserId = facebookData.sub;
      verifiedFirstName = facebookData.first_name || firstName;
      verifiedLastName = facebookData.last_name || lastName;
      verifiedAvatarUrl = facebookData.picture || avatarUrl;
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
          // Always update profile data from social provider if available
          ...(verifiedFirstName ? { firstName: verifiedFirstName } : {}),
          ...(verifiedLastName ? { lastName: verifiedLastName } : {}),
          ...(verifiedAvatarUrl ? { avatarUrl: verifiedAvatarUrl } : {}),
        })
        .where(eq(users.id, userId));
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          email: verifiedEmail,
          firstName: verifiedFirstName,
          lastName: verifiedLastName,
          avatarUrl: verifiedAvatarUrl,
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

/**
 * POST /api/auth/demo
 * Demo/guest login - creates or finds a demo user with a real JWT
 */
router.post('/demo', async (req: Request, res: Response) => {
  try {
    const demoEmail = 'demo@medinvest.com';

    let [demoUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, demoEmail))
      .limit(1);

    if (!demoUser) {
      [demoUser] = await db
        .insert(users)
        .values({
          email: demoEmail,
          firstName: 'Demo',
          lastName: 'User',
          provider: 'demo',
          isVerified: true,
          lastLoginAt: new Date(),
        })
        .returning();

      await db.insert(notificationPreferences).values({
        userId: demoUser.id,
      });
    } else {
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, demoUser.id));
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const [session] = await db
      .insert(userSessions)
      .values({
        userId: demoUser.id,
        token: crypto.randomUUID(),
        expiresAt,
      })
      .returning();

    const jwtToken = generateToken(demoUser.id, session.id);

    res.json({
      token: jwtToken,
      user: {
        id: demoUser.id,
        email: demoUser.email,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        isVerified: demoUser.isVerified,
        fullName: [demoUser.firstName, demoUser.lastName].filter(Boolean).join(' '),
        provider: 'demo',
      },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ message: 'Demo login failed' });
  }
});

export default router;
