// server/src/routes/user.routes.ts
import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import * as eventController from "../controllers/eventController";
import * as analyticsController from "../controllers/analyticsController";
import prisma from "../config/database";
import * as profileController from '../controllers/profileController';

const router = Router();

// GET /api/v1/users/me — returns current user from JWT
router.get("/me", authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      enrollment_year: true,
      degree_type: true,
      is_verified: true,
      total_points: true,
      total_volunteer_hours: true,
      avatar_url: true,
      created_at: true,
    },
  });

  res.json({ success: true, data: user ?? req.user });
});

// GET /api/v1/users/me/dashboard
router.get("/me/dashboard", authenticate, eventController.getStudentDashboard);

// GET /api/v1/users/me/stats
router.get("/me/stats", authenticate, analyticsController.getStudentStats);
router.get('/me/achievements',    authenticate, profileController.getAchievements);
router.get('/me/points-history',  authenticate, profileController.getPointsHistory);
router.post('/me/resume-export',  authenticate, profileController.exportResume);
// GET /api/v1/users/me/certificates
router.get("/me/certificates", authenticate, profileController.getCertificates);
 
// GET /api/v1/users/me/certificates/:certId/download
router.get("/me/certificates/:certId/download", authenticate, profileController.downloadCertificate);

export default router;
