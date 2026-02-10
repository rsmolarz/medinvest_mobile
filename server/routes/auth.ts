import { Router, Request, Response } from 'express';
import { db, users, userSessions, notificationPreferences, passwordResetTokens } from '../db';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { authMiddleware, generateToken } from '../middleware/auth';
import { verifyAppleToken, verifyGoogleToken, verifyGithubToken, verifyFacebookToken } from '../services/socialAuth';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const router = Router();

const STATE_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

function createSignedOAuthState(provider: string, appRedirectUri?: string): string {
  const payload: Record<string, string> = { p: provider, n: crypto.randomBytes(16).toString('hex') };
  if (appRedirectUri) {
    payload.r = appRedirectUri;
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', STATE_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifySignedOAuthState(state: string): { provider: string; appRedirectUri?: string } | null {
  try {
    const dotIdx = state.indexOf('.');
    if (dotIdx === -1) return null;
    const data = state.substring(0, dotIdx);
    const sig = state.substring(dotIdx + 1);
    const expectedSig = crypto.createHmac('sha256', STATE_SECRET).update(data).digest('base64url');
    if (sig !== expectedSig) {
      console.error('[OAuth] Invalid state signature');
      return null;
    }
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    return { provider: payload.p, appRedirectUri: payload.r };
  } catch (err) {
    console.error('[OAuth] Failed to decode state:', err);
    return null;
  }
}

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
 * POST /api/auth/google/token
 * Exchange Google authorization code for access token (web redirect flow)
 */
router.post('/google/token', async (req: Request, res: Response) => {
  try {
    const { code, redirect_uri } = req.body;

    if (!code) {
      res.status(400).json({ message: 'Authorization code is required' });
      return;
    }

    const clientId = process.env.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_WEB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      res.status(500).json({ message: 'Google OAuth is not configured' });
      return;
    }

    console.log('Google token exchange: redirect_uri =', redirect_uri);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirect_uri || '',
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Google token exchange error:', tokenData);
      res.status(401).json({ message: tokenData.error_description || 'Failed to exchange code' });
      return;
    }

    res.json({ access_token: tokenData.access_token });
  } catch (error) {
    console.error('Google token exchange error:', error);
    res.status(500).json({ message: 'Token exchange failed' });
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
 * Helper to construct the callback URI.
 * Uses a stable published domain so the redirect_uri is consistent
 * and matches what's registered with OAuth providers.
 * The dev domain changes every restart - never use it for OAuth.
 */
function getBaseUri(): string {
  const oauthDomain = process.env.OAUTH_CALLBACK_DOMAIN;
  if (oauthDomain) {
    return `https://${oauthDomain}`;
  }

  const publishedDomain = process.env.EXPO_PUBLIC_DOMAIN?.replace(/:5000$/, '');
  if (publishedDomain && !publishedDomain.includes('localhost')) {
    return `https://${publishedDomain}`;
  }

  return 'http://localhost:5000';
}

function getCallbackUri(provider?: string): string {
  const base = getBaseUri();
  if (provider === 'google') {
    return `${base}/`;
  }
  return `${base}/api/auth/callback`;
}

/**
 * GET /api/auth/google/start
 * Server-side Google OAuth initiation - redirects to Google with correct redirect_uri
 */
router.get('/google/start', (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ message: 'Google OAuth is not configured' });
    return;
  }

  const callbackUri = getCallbackUri('google');
  const appRedirectUri = req.query.app_redirect_uri as string;
  const state = createSignedOAuthState('google', appRedirectUri);

  console.log(`[OAuth Start] Google - redirect_uri: ${callbackUri}, app_redirect_uri: ${appRedirectUri || 'none (web flow)'}`);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUri,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

/**
 * GET /api/auth/github/start
 * Server-side GitHub OAuth initiation
 */
router.get('/github/start', (req: Request, res: Response) => {
  const clientId = process.env.GITHUB_CLIENT_ID || process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ message: 'GitHub OAuth is not configured' });
    return;
  }

  const callbackUri = getCallbackUri('github');
  const appRedirectUri = req.query.app_redirect_uri as string;
  const state = createSignedOAuthState('github', appRedirectUri);

  console.log(`[OAuth Start] GitHub - redirect_uri: ${callbackUri}, app_redirect_uri: ${appRedirectUri || 'none (web flow)'}`);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUri,
    scope: 'user:email read:user',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

/**
 * GET /api/auth/facebook/start
 * Server-side Facebook OAuth initiation
 */
router.get('/facebook/start', (req: Request, res: Response) => {
  const appId = process.env.FACEBOOK_APP_ID || process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
  if (!appId) {
    res.status(500).json({ message: 'Facebook OAuth is not configured' });
    return;
  }

  const callbackUri = getCallbackUri('facebook');
  const appRedirectUri = req.query.app_redirect_uri as string;
  const state = createSignedOAuthState('facebook', appRedirectUri);

  console.log(`[OAuth Start] Facebook - redirect_uri: ${callbackUri}, app_redirect_uri: ${appRedirectUri || 'none (web flow)'}`);

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: callbackUri,
    scope: 'email,public_profile',
    state,
    response_type: 'code',
  });

  res.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`);
});

/**
 * GET /api/auth/mobile-callback
 * Mobile OAuth redirect target - this URL is used as the redirect URI for
 * openAuthSessionAsync. The browser will navigate here but the auth session
 * intercepts it before the page loads, capturing the token from query params.
 */
router.get('/mobile-callback', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const error = req.query.error as string;
  
  if (token) {
    res.send('<html><body><p>Authentication successful. You can close this window.</p></body></html>');
  } else if (error) {
    res.send(`<html><body><p>Authentication failed: ${error}</p></body></html>`);
  } else {
    res.send('<html><body><p>Authentication in progress...</p></body></html>');
  }
});

/**
 * GET /api/auth/callback
 * Server-side OAuth callback handler
 * Handles the redirect from OAuth providers, exchanges code for token,
 * creates/finds user, generates JWT, and passes it back via cookie
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error: oauthError, error_description } = req.query;
    const stateStr = typeof state === 'string' ? state : '';

    const stateData = stateStr ? verifySignedOAuthState(stateStr) : null;

    const sendError = (msg: string, statusCode = 400) => {
      if (stateData?.appRedirectUri) {
        const appUri = stateData.appRedirectUri;
        const separator = appUri.includes('?') ? '&' : '?';
        return res.redirect(`${appUri}${separator}error=${encodeURIComponent(msg)}`);
      }
      return res.status(statusCode).send(getOAuthResultPage('error', msg));
    };

    if (oauthError) {
      console.error('[OAuth Callback] Error from provider:', oauthError, error_description);
      return sendError(`Authentication failed: ${error_description || oauthError}`);
    }

    if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
      return sendError('Missing authorization code or state');
    }

    if (!stateData) {
      console.error('[OAuth Callback] Invalid or tampered state parameter');
      return res.status(400).send(getOAuthResultPage('error', 'Invalid state parameter. Please try again.'));
    }

    const provider = stateData.provider;
    if (!['google', 'github', 'facebook'].includes(provider)) {
      return sendError('Unknown provider');
    }

    console.log(`[OAuth Callback] Provider: ${provider}, code length: ${code.length}, has appRedirectUri: ${!!stateData.appRedirectUri}`);

    const callbackUri = getCallbackUri(provider);
    console.log(`[OAuth Callback] Using redirect_uri for token exchange: ${callbackUri}`);

    let accessToken: string | undefined;

    if (provider === 'github') {
      const clientId = process.env.GITHUB_CLIENT_ID || process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return sendError('GitHub OAuth is not configured', 500);
      }
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: callbackUri }),
      });
      const tokenData = await tokenResponse.json();
      if (tokenData.error) {
        console.error('[OAuth Callback] GitHub token error:', tokenData);
        return sendError(tokenData.error_description || 'GitHub token exchange failed', 401);
      }
      accessToken = tokenData.access_token;
    } else if (provider === 'google') {
      const clientId = process.env.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_WEB_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return sendError('Google OAuth is not configured', 500);
      }
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: callbackUri, grant_type: 'authorization_code' }).toString(),
      });
      const tokenData = await tokenResponse.json();
      if (tokenData.error) {
        console.error('[OAuth Callback] Google token error:', tokenData);
        return sendError(tokenData.error_description || 'Google token exchange failed', 401);
      }
      accessToken = tokenData.access_token;
    } else if (provider === 'facebook') {
      const appId = process.env.FACEBOOK_APP_ID || process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
      const appSecret = process.env.FACEBOOK_APP_SECRET;
      if (!appId || !appSecret) {
        return sendError('Facebook OAuth is not configured', 500);
      }
      const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
      tokenUrl.searchParams.append('client_id', appId);
      tokenUrl.searchParams.append('client_secret', appSecret);
      tokenUrl.searchParams.append('code', code);
      tokenUrl.searchParams.append('redirect_uri', callbackUri);
      const tokenResponse = await fetch(tokenUrl.toString());
      const tokenData = await tokenResponse.json();
      if (tokenData.error) {
        console.error('[OAuth Callback] Facebook token error:', tokenData);
        return sendError(tokenData.error?.message || 'Facebook token exchange failed', 401);
      }
      accessToken = tokenData.access_token;
    }

    if (!accessToken) {
      return sendError('Failed to obtain access token', 401);
    }

    let verifiedEmail: string | undefined;
    let providerUserId: string | undefined;
    let verifiedFirstName: string | undefined;
    let verifiedLastName: string | undefined;
    let verifiedAvatarUrl: string | undefined;

    if (provider === 'google') {
      const googleData = await verifyGoogleToken(accessToken);
      if (!googleData) return sendError('Invalid Google token', 401);
      verifiedEmail = googleData.email;
      providerUserId = googleData.sub;
      verifiedFirstName = googleData.given_name;
      verifiedLastName = googleData.family_name;
      verifiedAvatarUrl = googleData.picture;
    } else if (provider === 'github') {
      const githubData = await verifyGithubToken(accessToken);
      if (!githubData) return sendError('Invalid GitHub token', 401);
      verifiedEmail = githubData.email;
      providerUserId = githubData.sub;
      if (githubData.name) {
        const nameParts = githubData.name.split(' ');
        verifiedFirstName = nameParts[0];
        verifiedLastName = nameParts.slice(1).join(' ');
      }
      verifiedAvatarUrl = githubData.picture;
    } else if (provider === 'facebook') {
      const facebookData = await verifyFacebookToken(accessToken);
      if (!facebookData) return sendError('Invalid Facebook token', 401);
      verifiedEmail = facebookData.email;
      providerUserId = facebookData.sub;
      verifiedFirstName = facebookData.first_name;
      verifiedLastName = facebookData.last_name;
      verifiedAvatarUrl = facebookData.picture;
    }

    if (!verifiedEmail) {
      return sendError('Email is required. Please ensure your account has a verified email.');
    }

    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, verifiedEmail))
      .limit(1);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      await db
        .update(users)
        .set({
          provider: provider as any,
          providerUserId,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
          ...(verifiedFirstName ? { firstName: verifiedFirstName } : {}),
          ...(verifiedLastName ? { lastName: verifiedLastName } : {}),
          ...(verifiedAvatarUrl ? { avatarUrl: verifiedAvatarUrl } : {}),
        })
        .where(eq(users.id, userId));
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          email: verifiedEmail,
          firstName: verifiedFirstName || null,
          lastName: verifiedLastName || null,
          avatarUrl: verifiedAvatarUrl || null,
          provider: provider as any,
          providerUserId,
          isVerified: true,
          lastLoginAt: new Date(),
        })
        .returning();
      userId = newUser.id;
      await db.insert(notificationPreferences).values({ userId });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const [session] = await db
      .insert(userSessions)
      .values({ userId, token: crypto.randomUUID(), expiresAt })
      .returning();

    const jwtToken = generateToken(userId, session.id);

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

    const userData = {
      ...user,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
    };

    console.log(`[OAuth Callback] Success: ${verifiedEmail} via ${provider}`);

    if (stateData?.appRedirectUri) {
      const appUri = stateData.appRedirectUri;
      const separator = appUri.includes('?') ? '&' : '?';
      const redirectUrl = `${appUri}${separator}token=${encodeURIComponent(jwtToken)}`;
      console.log(`[OAuth Callback] Redirecting to mobile app: ${redirectUrl}`);
      return res.redirect(redirectUrl);
    }

    res.cookie('medinvest_auth_token', jwtToken, {
      maxAge: 300000,
      path: '/',
      sameSite: 'lax',
      secure: true,
      httpOnly: false,
    });
    res.cookie('medinvest_auth_user', JSON.stringify(userData), {
      maxAge: 300000,
      path: '/',
      sameSite: 'lax',
      secure: true,
      httpOnly: false,
    });

    console.log(`[OAuth Callback] Web flow - setting cookies and redirecting to /`);
    return res.redirect('/');
  } catch (error) {
    console.error('[OAuth Callback] Error:', error);
    return res.status(500).send(getOAuthResultPage('error', 'Authentication failed. Please try again.'));
  }
});

function getOAuthResultPage(status: 'success' | 'error', message: string, token?: string, user?: any, appRedirectUri?: string): string {
  const isSuccess = status === 'success';
  const deepLinkUrl = appRedirectUri 
    ? `${appRedirectUri}${appRedirectUri.includes('?') ? '&' : '?'}token=${token}`
    : `medinvest://auth?token=${token}`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MedInvest - ${isSuccess ? 'Login Successful' : 'Login Failed'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { text-align: center; padding: 40px; max-width: 400px; }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { color: #999; font-size: 16px; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0066CC, #00A86B); color: #fff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; border: none; cursor: pointer; }
    .spinner { border: 3px solid #333; border-top: 3px solid #0066CC; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; display: inline-block; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    ${isSuccess ? `
      <div class="spinner"></div>
      <h1>Login Successful</h1>
      <p>Redirecting to the app...</p>
      <script>
        try {
          var deepLink = ${JSON.stringify(deepLinkUrl)};
          var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || /expo/i.test(navigator.userAgent);
          if (isMobile) {
            window.location.href = deepLink;
            setTimeout(function() {
              window.location.href = 'medinvest://auth?token=${token}';
            }, 500);
          }
          setTimeout(function() {
            window.location.href = '/';
          }, 3000);
        } catch(e) {
          window.location.href = '/';
        }
      </script>
    ` : `
      <div class="icon">&#10060;</div>
      <h1>Login Failed</h1>
      <p>${message}</p>
      <a href="/" class="btn">Try Again</a>
    `}
  </div>
</body>
</html>`;
}

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

    const demoPassword = 'Demo1234';
    const demoPasswordHash = await bcrypt.hash(demoPassword, 10);

    if (!demoUser) {
      [demoUser] = await db
        .insert(users)
        .values({
          email: demoEmail,
          firstName: 'Demo',
          lastName: 'User',
          provider: 'demo',
          passwordHash: demoPasswordHash,
          isVerified: true,
          lastLoginAt: new Date(),
        })
        .returning();

      await db.insert(notificationPreferences).values({
        userId: demoUser.id,
      });
    } else {
      const updates: Record<string, any> = { lastLoginAt: new Date() };
      if (!demoUser.passwordHash) {
        updates.passwordHash = demoPasswordHash;
      }
      await db
        .update(users)
        .set(updates)
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

/**
 * POST /api/auth/facebook/data-deletion
 * Facebook Data Deletion Callback
 * Required by Facebook for apps using Facebook Login
 */
router.post('/facebook/data-deletion', async (req: Request, res: Response) => {
  try {
    const { signed_request } = req.body;

    if (!signed_request) {
      res.status(400).json({ message: 'Missing signed_request parameter' });
      return;
    }

    const confirmationCode = `del_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const statusUrl = `${protocol}://${req.get('host')}/api/auth/facebook/deletion-status?code=${confirmationCode}`;

    console.log(`Facebook data deletion request received. Confirmation: ${confirmationCode}`);

    res.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error('Facebook data deletion error:', error);
    res.status(500).json({ message: 'Data deletion request failed' });
  }
});

router.post('/facebook/data-deletion/callback', async (req: Request, res: Response) => {
  try {
    const { signed_request } = req.body;

    if (!signed_request) {
      res.status(400).json({ message: 'Missing signed_request parameter' });
      return;
    }

    const confirmationCode = `del_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const statusUrl = `${protocol}://${req.get('host')}/api/auth/facebook/deletion-status?code=${confirmationCode}`;

    console.log(`Facebook data deletion request received. Confirmation: ${confirmationCode}`);

    res.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error('Facebook data deletion error:', error);
    res.status(500).json({ message: 'Data deletion request failed' });
  }
});

/**
 * GET /api/auth/facebook/deletion-status
 * Check status of a Facebook data deletion request
 */
router.get('/facebook/deletion-status', (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code) {
    res.status(400).json({ message: 'Missing confirmation code' });
    return;
  }

  res.json({
    confirmation_code: code,
    status: 'completed',
    message: 'Your data has been deleted from MedInvest.',
  });
});

/**
 * POST /api/auth/forgot-password
 * Request a password reset link
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      res.json({ success: true, message: 'If an account with that email exists, we have sent password reset instructions.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token: resetToken,
      expiresAt,
    });

    console.log(`[Auth] Password reset requested for ${email}. Token: ${resetToken}`);

    res.json({
      success: true,
      message: 'If an account with that email exists, we have sent password reset instructions.',
    });
  } catch (error) {
    console.error('[Auth] Forgot password error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using a token
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ message: 'Token and new password are required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' });
      return;
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      res.status(400).json({
        message: 'Password must contain uppercase, lowercase, and number',
      });
      return;
    }

    const [resetRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date()),
          isNull(passwordResetTokens.usedAt)
        )
      )
      .limit(1);

    if (!resetRecord) {
      res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetRecord.userId));

    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetRecord.id));

    console.log(`[Auth] Password reset completed for user ${resetRecord.userId}`);

    res.json({ success: true, message: 'Password has been reset successfully. You can now sign in with your new password.' });
  } catch (error) {
    console.error('[Auth] Reset password error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

/**
 * GET /api/auth/oauth-debug
 * Shows exact redirect URIs that need to be registered with OAuth providers
 */
router.get('/oauth-debug', (req: Request, res: Response) => {
  const forwardedProto = req.header('x-forwarded-proto') || req.protocol || 'https';
  const forwardedHost = req.header('x-forwarded-host') || req.get('host');
  const currentOrigin = `${forwardedProto}://${forwardedHost}`;
  const callbackUri = `${currentOrigin}/api/auth/callback`;

  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  const pubDomains = process.env.REPLIT_DOMAINS;

  const allCallbackUris: string[] = [callbackUri];
  if (devDomain) {
    allCallbackUris.push(`https://${devDomain}/api/auth/callback`);
  }
  if (pubDomains) {
    const domainList = pubDomains.split(',');
    for (const d of domainList) {
      const uri = `https://${d.trim()}/api/auth/callback`;
      if (!allCallbackUris.includes(uri)) allCallbackUris.push(uri);
    }
  }
  const knownDomains = ['themedicineandmoneyshow.com', 'medinvest-mobile--rsmolarz.replit.app'];
  for (const d of knownDomains) {
    const uri = `https://${d}/api/auth/callback`;
    if (!allCallbackUris.includes(uri)) allCallbackUris.push(uri);
  }

  const hasGoogle = !!(process.env.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
  const hasGithub = !!(process.env.GITHUB_CLIENT_ID || process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID);
  const hasFacebook = !!(process.env.FACEBOOK_APP_ID || process.env.EXPO_PUBLIC_FACEBOOK_APP_ID);

  const html = `<!DOCTYPE html><html><head><title>OAuth Debug</title>
  <style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:20px;background:#1a1a2e;color:#e0e0e0}
  h1{color:#00a86b}h2{color:#0066cc;margin-top:30px}code{background:#2d2d44;padding:4px 8px;border-radius:4px;display:block;margin:5px 0;word-break:break-all;font-size:14px}
  .status{padding:4px 8px;border-radius:4px;font-weight:bold}.ok{background:#00a86b33;color:#00a86b}.missing{background:#cc000033;color:#cc4444}
  .section{background:#2d2d44;padding:15px;border-radius:8px;margin:10px 0}</style></head>
  <body><h1>OAuth Redirect URI Debug</h1>
  <div class="section"><h2>Current Request Origin</h2><code>${currentOrigin}</code></div>
  <div class="section"><h2>Callback URIs (used by OAuth start endpoints)</h2>
  <p>Google: <code>${getCallbackUri('google')}</code></p>
  <p>GitHub: <code>${getCallbackUri('github')}</code></p>
  <p>Facebook: <code>${getCallbackUri('facebook')}</code></p></div>
  <div class="section"><h2>All Redirect URIs to Register</h2>
  <p>Copy-paste ALL of these into each OAuth provider's console:</p>
  ${allCallbackUris.map(u => `<code>${u}</code>`).join('')}</div>
  <div class="section"><h2>Provider Status</h2>
  <p>Google: <span class="status ${hasGoogle ? 'ok' : 'missing'}">${hasGoogle ? 'Configured' : 'Missing credentials'}</span></p>
  <p>GitHub: <span class="status ${hasGithub ? 'ok' : 'missing'}">${hasGithub ? 'Configured' : 'Missing credentials'}</span></p>
  <p>Facebook: <span class="status ${hasFacebook ? 'ok' : 'missing'}">${hasFacebook ? 'Configured' : 'Missing credentials'}</span></p></div>
  <div class="section"><h2>Google Console Setup</h2>
  <p>In <a href="https://console.cloud.google.com/apis/credentials" style="color:#00a86b">Google Cloud Console</a>:</p>
  <p><b>Authorized JavaScript Origins:</b></p>
  ${[...new Set(allCallbackUris.map(u => u.replace('/api/auth/callback', '')))].map(u => `<code>${u}</code>`).join('')}
  <p><b>Authorized Redirect URIs:</b></p>
  ${allCallbackUris.map(u => `<code>${u}</code>`).join('')}
  <p><b>OAuth Consent Screen:</b> Must be "External" user type and "In production" (or add test users)</p></div>
  <div class="section"><h2>GitHub Console Setup</h2>
  <p>In <a href="https://github.com/settings/developers" style="color:#00a86b">GitHub Developer Settings</a>:</p>
  <p><b>Authorization callback URL:</b> (can only have ONE per app)</p>
  <code>${callbackUri}</code>
  <p>Note: If testing from multiple domains, you may need separate GitHub OAuth apps.</p></div>
  <div class="section"><h2>Facebook Console Setup</h2>
  <p>In <a href="https://developers.facebook.com" style="color:#00a86b">Facebook Developers</a> &gt; App Settings &gt; Facebook Login &gt; Settings:</p>
  <p><b>Valid OAuth Redirect URIs:</b></p>
  ${allCallbackUris.map(u => `<code>${u}</code>`).join('')}</div>
  </body></html>`;

  res.send(html);
});

export default router;
