// server/src/routes/club.routes.ts

import { Router } from "express";
import { authenticate, authenticateOptional } from "../middleware/auth";
import { rbac } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createClubSchema,
  joinLeaveClubSchema,
  listClubsSchema,
  clubIdParamSchema,
} from "../validators/club.validator";
import * as clubController from "../controllers/clubController";
import * as analyticsController from "../controllers/analyticsController";

const router = Router();

// ─── CRITICAL: all literal-path routes MUST come before /:id ─────────────────
// Express matches routes top-to-bottom. If /:id (with UUID validation) appears
// first, requests to /my get treated as a club ID, fail UUID validation → 422.

// GET /api/v1/clubs/my — clubs the authenticated user has joined
router.get(
  "/my",
  authenticate,
  clubController.getMyClubs
);

// GET /api/v1/clubs — list approved clubs (auth optional for isJoined flag)
router.get(
  "/",
  authenticateOptional,
  validate(listClubsSchema),
  clubController.listClubs
);

// POST /api/v1/clubs — create club (any authenticated user; goes to pending)
router.post(
  "/",
  authenticate,
  validate(createClubSchema),
  clubController.createClub
);

// ─── /:id routes — UUID validated, must be AFTER all literal routes ───────────

// GET /api/v1/clubs/:id — club detail
router.get(
  "/:id",
  authenticateOptional,
  validate(clubIdParamSchema),
  clubController.getClub
);

// GET /api/v1/clubs/:id/analytics
router.get(
  "/:id/analytics",
  authenticate,
  validate(clubIdParamSchema),
  analyticsController.getClubAnalytics
);

// GET /api/v1/clubs/:id/members — full member roster
router.get(
  "/:id/members",
  authenticate,
  validate(clubIdParamSchema),
  clubController.getClubMembers
);

// POST /api/v1/clubs/:id/members/invite — add member by email (super_admin only)
// NOTE: /invite literal must be before /:memberId to avoid Express catching "invite" as a memberId
router.post(
  "/:id/members/invite",
  authenticate,
  rbac("super_admin"),
  validate(clubIdParamSchema),
  clubController.inviteMember
);

// PATCH /api/v1/clubs/:id/members/:memberId/role — change a member's role (super_admin only)
router.patch(
  "/:id/members/:memberId/role",
  authenticate,
  rbac("super_admin"),
  validate(clubIdParamSchema),
  clubController.updateMemberRole
);

// DELETE /api/v1/clubs/:id/members/:memberId — remove a member (super_admin only)
router.delete(
  "/:id/members/:memberId",
  authenticate,
  rbac("super_admin"),
  validate(clubIdParamSchema),
  clubController.removeMember
);

// POST /api/v1/clubs/:id/join — join a club
router.post(
  "/:id/join",
  authenticate,
  rbac("student", "member", "secretary", "event_manager", "super_admin"),
  validate(joinLeaveClubSchema),
  clubController.joinClub
);

// DELETE /api/v1/clubs/:id/leave — leave a club
router.delete(
  "/:id/leave",
  authenticate,
  validate(joinLeaveClubSchema),
  clubController.leaveClub
);

export default router;