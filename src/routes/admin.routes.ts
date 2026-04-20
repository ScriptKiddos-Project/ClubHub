// server/src/routes/admin.routes.ts
// Super Admin routes: club approval, community/access-code management.

import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { rbac } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { approveClubSchema } from "../validators/club.validator";
import * as clubController from "../controllers/clubController";

const router = Router();

// All admin routes require authentication + super_admin role
router.use(authenticate, rbac("super_admin"));

// ─── Club Approval ────────────────────────────────────────────────────────────
// GET /api/v1/admin/clubs/pending
router.get("/clubs/pending", clubController.listPendingClubs);

// PUT /api/v1/admin/clubs/:id/approve
router.put(
  "/clubs/:id/approve",
  validate(approveClubSchema),
  clubController.approveOrRejectClub
);

// ─── Analytics (stub — implemented fully in Phase 1D) ─────────────────────────
// GET /api/v1/admin/analytics
router.get("/analytics", (_req, res) => {
  res.status(501).json({
    success: false,
    error: { code: "NOT_IMPLEMENTED", message: "Analytics implemented in Phase 1D" },
  });
});

export default router;