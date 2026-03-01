import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '@config/env';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      workspaceId?: string;
      userRole?: string;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('No authentication token provided', 401, 'UNAUTHORIZED');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      workspaceId: string;
      role: string;
    };

    req.userId = decoded.userId;
    req.workspaceId = decoded.workspaceId;
    req.userRole = decoded.role;

    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
    next(err);
  }
};

export const generateToken = (userId: string, workspaceId: string, role: string): string => {
  return jwt.sign(
    { userId, workspaceId, role },
    config.jwt.secret as jwt.Secret,
    { expiresIn: '7d' },
  );
};
