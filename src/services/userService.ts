// server/src/services/userService.ts
// User management business logic — Super Admin operations.

import prisma from "../config/database";
import { AppError } from "../utils/AppError";
import { Role } from "@prisma/client";
import { PaginatedResponse } from "../types";

export interface UserListItem {
  id:              string;
  name:            string;
  email:           string;
  role:            Role;
  department:      string | null;
  enrollment_year: number | null;
  total_points:    number;
  is_verified:     boolean;
  created_at:      Date;
}

// ─── List all users (paginated + searchable) ──────────────────────────────────
export async function listAllUsers(params: {
  page?:   number;
  limit?:  number;
  search?: string;
  role?:   Role;
}): Promise<PaginatedResponse<UserListItem>> {
  const { page = 1, limit = 50, search, role } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name:  { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { department: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id:              true,
        name:            true,
        email:           true,
        role:            true,
        department:      true,
        enrollment_year: true,
        total_points:    true,
        is_verified:     true,
        created_at:      true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    meta: { total, page, limit, has_more: skip + users.length < total },
  };
}

// ─── Change a user's role ─────────────────────────────────────────────────────
export async function changeUserRole(
  userId:  string,
  newRole: Role,
  adminId: string
): Promise<{ id: string; role: Role }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  // Prevent super_admin from demoting themselves
  if (userId === adminId && newRole !== Role.super_admin) {
    throw new AppError("You cannot change your own super_admin role", 403, "SELF_ROLE_CHANGE");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data:  { role: newRole },
    select: { id: true, role: true },
  });

  await prisma.auditLog.create({
    data: {
      action:      "USER_ROLE_CHANGED",
      actor_id:    adminId,
      target_type: "user",
      target_id:   userId,
      metadata:    { old_role: user.role, new_role: newRole },
    },
  });

  return updated;
}