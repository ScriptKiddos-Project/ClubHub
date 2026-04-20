// server/src/routes/club.routes.ts
// Club routes — applies middleware + maps to controllers.

import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { rbac } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createClubSchema,
  joinLeaveClubSchema,
  listClubsSchema,
  clubIdParamSchema,
} from "../validators/club.validator";
import * as clubController from "../controllers/clubController";

const router = Router();

// ─── Public/Authenticated club routes ─────────────────────────────────────────

// GET /api/v1/clubs — list approved clubs (any authenticated user)
router.get(
  "/",
  authenticate,
  validate(listClubsSchema),
  clubController.listClubs
);

// GET /api/v1/clubs/:id — club detail
router.get(
  "/:id",
  authenticate,
  validate(clubIdParamSchema),
  clubController.getClub
);

// POST /api/v1/clubs — create club (any authenticated; goes to pending approval)
router.post(
  "/",
  authenticate,
  validate(createClubSchema),
  clubController.createClub
);

// POST /api/v1/clubs/:id/join — join a club (student, member)
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