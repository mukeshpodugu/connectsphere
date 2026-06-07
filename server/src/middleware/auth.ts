import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request types to support user variables
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        isAdmin: boolean;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token missing.' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'connectsphere_secret_key_123';

  jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      isAdmin: decoded.isAdmin || false
    };

    next();
  });
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
  next();
};
