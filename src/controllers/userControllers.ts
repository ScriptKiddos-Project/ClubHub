// server/src/controllers/userController.ts
// Thin controller for Super Admin user management.

import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService";
import { Role } from "@prisma/client";
import { AppError } from "../utils/AppError";

// GET /api/v1/admin/users
export async function listAllUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page   = Number(req.query.page  ?? 1);
    const limit  = Number(req.query.limit ?? 50);
    const search = req.query.search as string | undefined;
    const role   = req.query.role   as Role   | undefined;

    if (role && !Object.values(Role).includes(role)) {
      throw new AppError("Invalid role filter", 400, "INVALID_ROLE");
    }

    const result = await userService.listAllUsers({ page, limit, search, role });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/admin/users/:id/role
export async function changeUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.body as { role: Role };

    if (!role || !Object.values(Role).includes(role)) {
      throw new AppError("A valid role is required", 400, "INVALID_ROLE");
    }

    const result = await userService.changeUserRole(
      req.params.id,
      role,
      req.user!.id
    );
    res.json({ success: true, data: result, message: "User role updated" });
  } catch (err) {
    next(err);
  }
}