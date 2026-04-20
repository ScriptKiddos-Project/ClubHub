import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { AuthenticatedUser } from '../types';

export const ownsResource = (
  field: string,
  source: 'params' | 'body' = 'params',
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    if (user.role === 'super_admin') {
      next();
      return;
    }

    const resourceId =
      source === 'params' ? req.params[field] : req.body[field];

    if (!resourceId) {
      throw new AppError(`Missing field: ${field}`, 400, 'BAD_REQUEST');
    }

    if (user.id !== resourceId) {
      throw new AppError(
        'You do not have permission to access this resource',
        403,
        'FORBIDDEN',
      );
    }

    next();
  };
};

export const belongsToClub = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    if (user.role === 'super_admin') {
      next();
      return;
    }

    const clubId = req.params[paramName];

    if (!clubId) {
      throw new AppError(`Missing param: ${paramName}`, 400, 'BAD_REQUEST');
    }

    const memberClubIds: string[] = user.clubIds ?? [];

    if (!memberClubIds.includes(clubId)) {
      throw new AppError(
        'You are not a member of this club',
        403,
        'FORBIDDEN',
      );
    }

    next();
  };
};