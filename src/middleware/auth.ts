// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication token is required');
      return;
    }

    const payload = verifyAccessToken(token);

    if (payload.type !== 'access') {
      sendError(res, 401, 'INVALID_TOKEN', 'Invalid token type');
      return;
    }

    req.user = {
      id: payload.userId,
      email: payload.email,
      name: '',
      role: payload.role,
      is_verified: true,
    };

    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      sendError(res, 401, 'TOKEN_EXPIRED', 'Access token has expired');
    } else {
      sendError(res, 401, 'INVALID_TOKEN', 'Invalid access token');
    }
  }
}
