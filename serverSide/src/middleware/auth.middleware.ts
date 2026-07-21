


import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { UserService } from '../services/user.service';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        phoneNumber: string;
        email?: string;
      };
      userId?: string;
    }
  }
}

export interface AuthRequest extends Request {
  user: {
    uid: string;
    phoneNumber: string;
    email?: string;
  };
  userId: string;
}

// Middleware to verify JWT
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    // Check if user exists in our database
    const user = await UserService.getUser(decoded.uid);
    
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Now decoded has uid property
    req.user = {
      uid: decoded.uid,
      phoneNumber: decoded.phoneNumber,
      email: decoded.email,
    };
    req.userId = decoded.uid;
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        res.status(401).json({ error: 'Token expired' });
      } else if (error.message.includes('Invalid')) {
        res.status(401).json({ error: 'Invalid token' });
      } else {
        res.status(401).json({ error: error.message });
      }
    } else {
      res.status(500).json({ error: 'Authentication error' });
    }
  }
};

// Optional: Firebase authentication middleware (placeholder for now)
export const authenticateFirebase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // We'll implement Firebase token verification later
    // For now, just pass through
    // TODO: Implement Firebase token verification
    
    next();
  } catch (error) {
    console.error('Firebase auth error:', error);
    res.status(401).json({ error: 'Invalid Firebase token' });
  }
};