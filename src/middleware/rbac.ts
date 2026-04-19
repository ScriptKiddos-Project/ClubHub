// src/middleware/rbac.ts
import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { sendError } from '../utils/response';

/**
 * RBAC middleware factory — pass allowed roles as arguments.
 * Usage: router.get('/admin/clubs', authenticate, rbac('super_admin'), handler)
 * Usage: router.post('/events', authenticate, rbac('event_manager', 'super_admin'), handler)
 */
export function rbac(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        403,
        'FORBIDDEN',
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
      return;
    }

    next();
  };
}

/**
 * Checks if user has at least one of the specified roles.
 * Can be used in service-layer checks (non-middleware).
 */
export function hasRole(userRole: Role, ...allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Role hierarchy check — returns true if userRole has equal or higher privileges.
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  student: 0,
  member: 1,
  secretary: 2,
  event_manager: 2,
  club_admin: 3,
  super_admin: 4,
};

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}
