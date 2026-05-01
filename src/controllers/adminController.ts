// server/src/controllers/adminController.ts
// Thin controller for super admin broadcast operations.

import { Request, Response, NextFunction } from "express";
import * as adminService from "../services/adminService";

// POST /api/v1/admin/announcements
export async function broadcastAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, body, club_id } = req.body;
    const result = await adminService.broadcastAnnouncement(
      { title, body, club_id },
      req.user!.id
    );
    res.status(201).json({
      success: true,
      data: result,
      message: `Announcement sent to ${result.sent_to} users`,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/announcements
export async function listAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminService.listAnnouncements();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}