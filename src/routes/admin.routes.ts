// server/src/routes/admin.routes.ts
// Super Admin routes: club approval, club edit, user management,
// community/access-code management, global announcements.

import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { rbac } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import { approveClubSchema } from "../validators/club.validator";
import * as clubController from "../controllers/clubController";
import * as analyticsController from "../controllers/analyticsController";
import * as userController from "../controllers/userControllers";
import * as communityController from "../controllers/communityController";
import * as adminController from "../controllers/adminController";
import { triggerRankingJobManually } from "../jobs/rankingCron";

const router = Router();

// All admin routes require authentication + super_admin role
router.use(authenticate, rbac("super_admin"));

// ─── Club Approval ────────────────────────────────────────────────────────────
// GET  /api/v1/admin/clubs/pending
router.get("/clubs/pending", clubController.listPendingClubs);

// PUT  /api/v1/admin/clubs/:id/approve
router.put(
  "/clubs/:id/approve",
  validate(approveClubSchema),
  clubController.approveOrRejectClub
);

// ─── Club Management (Super Admin can edit any club) ─────────────────────────
// GET  /api/v1/admin/clubs  — list ALL clubs (all statuses)
router.get("/clubs", clubController.listAllClubs);

// PUT  /api/v1/admin/clubs/:id  — edit any club's details
router.put("/clubs/:id", clubController.updateClub);

// ─── User Management ──────────────────────────────────────────────────────────
// GET  /api/v1/admin/users  — list all users (paginated, searchable)
router.get("/users", userController.listAllUsers);

// PATCH /api/v1/admin/users/:id/role  — change a user's platform role
router.patch("/users/:id/role", userController.changeUserRole);

// ─── Community & Access Codes ─────────────────────────────────────────────────
// POST /api/v1/admin/communities  — create tenure community for a club
router.post("/communities", communityController.createCommunity);

// GET  /api/v1/admin/communities  — list all communities
router.get("/communities", communityController.listCommunities);

// POST /api/v1/admin/communities/:id/generate-code
router.post("/communities/:id/generate-code", communityController.generateCode);

// PUT  /api/v1/admin/communities/:id/revoke-code
router.put("/communities/:id/revoke-code", communityController.revokeCode);

// GET  /api/v1/admin/communities/:id/code-usage
router.get("/communities/:id/code-usage", communityController.getCodeUsage);

// ─── Global Announcements ─────────────────────────────────────────────────────
// POST /api/v1/admin/announcements  — broadcast to all users or specific club
router.post("/announcements", adminController.broadcastAnnouncement);

// GET  /api/v1/admin/announcements  — list past broadcasts
router.get("/announcements", adminController.listAnnouncements);

// ─── Analytics ────────────────────────────────────────────────────────────────
// GET  /api/v1/admin/analytics
router.get("/analytics", analyticsController.getGlobalAnalytics);

// ─── Ranking Job (manual trigger) ─────────────────────────────────────────────
// POST /api/v1/admin/run-ranking-job
router.post(
  "/run-ranking-job",
  asyncHandler(async (_req, res) => {
    const result = await triggerRankingJobManually();
    res.json({ success: true, data: result, message: "Ranking job completed successfully" });
  })
);

export default router;