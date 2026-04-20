// server/src/routes/user.routes.ts
import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import * as eventController from "../controllers/eventController";

const router = Router();

// GET /api/v1/users/me — returns current user from JWT
router.get("/me", authenticate, (req: Request, res: Response) => {
  res.json({ success: true, data: req.user });
});

// GET /api/v1/users/me/dashboard
router.get("/me/dashboard", authenticate, eventController.getStudentDashboard);

// GET /api/v1/users/me/stats
router.get("/me/stats", authenticate, (_req, res) => {
  res.status(501).json({
    success: false,
    error: { code: "NOT_IMPLEMENTED", message: "Stats implemented in Phase 1D" },
  });
});

export default router;