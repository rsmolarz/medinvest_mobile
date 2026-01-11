import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, userSessions, users } from '../db/index';
import { eq, and, gt } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isVerified: boolean;
  isAccredited: boolean;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      token?: string;
    }
  }
}

/**
 * Generate JWT token
 */
export function generateToken(userId: string, sessionId: string): string {
  return jwt.sign(
    { userId, sessionId },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { userId: string; sessionId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      sessionId: string;
    };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Auth middleware - requires valid token
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    // Check session exists and is not expired
    const [session] = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.id, decoded.sessionId),
          eq(userSessions.userId, decoded.userId),
          gt(userSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      res.status(401).json({ message: 'Session expired' });
      return;
    }

    // Get user
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isVerified: users.isVerified,
        isAccredited: users.isAccredited,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Attach user and token to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
}

/**
 * Optional auth middleware - attaches user if token present
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      next();
      return;
    }

    const [session] = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.id, decoded.sessionId),
          eq(userSessions.userId, decoded.userId),
          gt(userSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      next();
      return;
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isVerified: users.isVerified,
        isAccredited: users.isAccredited,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (user) {
      req.user = user;
      req.token = token;
    }

    next();
  } catch (error) {
    // Don't fail on optional auth
    next();
  }
}
