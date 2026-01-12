import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// ============================================
// Facebook Sign In Verification
// ============================================

interface FacebookUserPayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Verify Facebook access token and get user info
 */
export async function verifyFacebookToken(
  accessToken: string
): Promise<FacebookUserPayload | null> {
  try {
    // Fetch user info from Facebook Graph API
    const userResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture.type(large)&access_token=${accessToken}`
    );

    if (!userResponse.ok) {
      console.error('Facebook user fetch failed:', userResponse.status);
      return null;
    }

    const userData = await userResponse.json();

    return {
      sub: userData.id,
      email: userData.email,
      name: userData.name,
      picture: userData.picture?.data?.url,
      first_name: userData.first_name,
      last_name: userData.last_name,
    };
  } catch (error) {
    console.error('Facebook token verification failed:', error);
    return null;
  }
}

// ============================================
// GitHub Sign In Verification
// ============================================

interface GitHubUserPayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  login: string;
}

/**
 * Exchange GitHub OAuth code for access token and get user info
 */
export async function verifyGithubToken(
  accessToken: string
): Promise<GitHubUserPayload | null> {
  try {
    // Fetch user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      console.error('GitHub user fetch failed:', userResponse.status);
      return null;
    }

    const userData = await userResponse.json();

    // Fetch primary email if not public
    let email = userData.email;
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find(
          (e: any) => e.primary && e.verified
        );
        email = primaryEmail?.email;
      }
    }

    return {
      sub: String(userData.id),
      email,
      name: userData.name,
      picture: userData.avatar_url,
      login: userData.login,
    };
  } catch (error) {
    console.error('GitHub token verification failed:', error);
    return null;
  }
}

// ============================================
// Apple Sign In Verification
// ============================================

const appleJwksClient = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 86400000, // 1 day
});

interface AppleTokenPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  email?: string;
  email_verified?: string;
  is_private_email?: string;
  auth_time: number;
  nonce_supported: boolean;
}

/**
 * Verify Apple Sign In identity token
 */
export async function verifyAppleToken(
  identityToken: string
): Promise<AppleTokenPayload | null> {
  try {
    // Decode the token header to get the key id
    const decodedHeader = jwt.decode(identityToken, { complete: true });
    
    if (!decodedHeader || typeof decodedHeader === 'string') {
      return null;
    }

    const kid = decodedHeader.header.kid;

    // Get the signing key from Apple
    const signingKey = await appleJwksClient.getSigningKey(kid);
    const publicKey = signingKey.getPublicKey();

    // Verify the token
    const payload = jwt.verify(identityToken, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://appleid.apple.com',
      audience: process.env.APPLE_CLIENT_ID,
    }) as AppleTokenPayload;

    return payload;
  } catch (error) {
    console.error('Apple token verification failed:', error);
    return null;
  }
}

// ============================================
// Google Sign In Verification
// ============================================

interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
  iat: number;
  exp: number;
}

/**
 * Verify Google Sign In access token
 */
export async function verifyGoogleToken(
  accessToken: string
): Promise<GoogleTokenPayload | null> {
  try {
    // Fetch user info from Google
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Google token verification failed:', response.status);
      return null;
    }

    const userInfo = await response.json();

    return {
      iss: 'https://accounts.google.com',
      azp: '',
      aud: '',
      sub: userInfo.sub,
      email: userInfo.email,
      email_verified: userInfo.email_verified,
      name: userInfo.name,
      picture: userInfo.picture,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      locale: userInfo.locale,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    return null;
  }
}

/**
 * Alternative: Verify Google ID token (for web/native clients that provide id_token)
 */
export async function verifyGoogleIdToken(
  idToken: string
): Promise<GoogleTokenPayload | null> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();

    // Verify audience matches our client ID
    const validClientIds = [
      process.env.GOOGLE_WEB_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
    ].filter(Boolean);

    if (!validClientIds.includes(payload.aud)) {
      console.error('Google token has invalid audience');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Google ID token verification failed:', error);
    return null;
  }
}
