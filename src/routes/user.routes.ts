// server/src/routes/user.routes.ts
// User-facing routes: dashboard, stats.

import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as eventController from "../controllers/eventController";

const router = Router();

// GET /api/v1/users/me/dashboard
router.get("/me/dashboard", authenticate, eventController.getStudentDashboard);

// GET /api/v1/users/me/stats — (full implementation in Phase 1D)
router.get("/me/stats", authenticate, (_req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Detailed stats implemented in Phase 1D",
    },
  });
});

export default router;
