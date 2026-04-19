import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Ensures the authenticated user can only access their own resources.
 * Compares req.user.id against a param or body field.
 *
 * Usage:
 *   router.get('/users/:userId/stats', auth, ownsResource('userId'), controller)
 *   router.patch('/profile', auth, ownsResource('id', 'body'), controller)
 */
export const ownsResource = (
  field: string,
  source: 'params' | 'body' = 'params',
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Super admins bypass ownership checks
    if (user.role === 'super_admin') {
      next();
      return;
    }

    const resourceId =
      source === 'params' ? req.params[field] : req.body[field];

    if (!resourceId) {
      throw new AppError('BAD_REQUEST', `Missing field: ${field}`, 400);
    }

    if (user.id !== resourceId) {
      throw new AppError(
        'FORBIDDEN',
        'You do not have permission to access this resource',
        403,
      );
    }

    next();
  };
};

/**
 * Ensures the authenticated user belongs to the club they are acting on.
 * Reads clubId from req.params.id or req.params.clubId.
 * Relies on req.user.clubIds being populated by auth middleware.
 */
export const belongsToClub = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    if (user.role === 'super_admin') {
      next();
      return;
    }

    const clubId = req.params[paramName];

    if (!clubId) {
      throw new AppError('BAD_REQUEST', `Missing param: ${paramName}`, 400);
    }

    const memberClubIds: string[] = user.clubIds ?? [];

    if (!memberClubIds.includes(clubId)) {
      throw new AppError(
        'FORBIDDEN',
        'You are not a member of this club',
        403,
      );
    }

    next();
  };
};