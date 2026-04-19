// server/src/middleware/rbac.ts
import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { sendError } from "../utils/response";

/**
 * Middleware factory — pass allowed roles as spread args.
 * Always use AFTER authenticate middleware.
 *
 * router.post("/events", authenticate, rbac("event_manager", "super_admin"), handler)
 */
export function rbac(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, "UNAUTHORIZED", "Authentication required");
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        403,
        "FORBIDDEN",
        `Access denied. Required roles: ${allowedRoles.join(", ")}`
      );
      return;
    }

    next();
  };
}

/**
 * Service-layer role check (non-middleware).
 * Use inside services for conditional logic.
 */
export function hasRole(userRole: Role, ...allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Hierarchy check — true if userRole >= minRole in privilege level.
 * Mirrors the 5 roles defined in schema.prisma.
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  student: 0,
  member: 1,
  secretary: 1,
  event_manager: 1,
  club_admin: 2,
  super_admin: 3,
};

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}