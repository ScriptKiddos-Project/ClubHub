// server/src/routes/admin.routes.ts
// Super Admin routes: club approval, community/access-code management.

import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { rbac } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import { approveClubSchema } from "../validators/club.validator";
import * as clubController from "../controllers/clubController";
import * as analyticsController from "../controllers/analyticsController";
import { triggerRankingJobManually } from "../jobs/rankingCron";

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
router.get("/analytics", analyticsController.getGlobalAnalytics);

// POST /api/v1/admin/run-ranking-job
router.post(
  "/run-ranking-job",
  asyncHandler(async (_req, res) => {
    const result = await triggerRankingJobManually();
    res.json({ success: true, data: result, message: "Ranking job completed successfully" });
  })
);

export default router;
