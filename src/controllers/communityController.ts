// server/src/controllers/communityController.ts

import { Request, Response, NextFunction } from "express";
import * as communityService from "../services/communityService";

// POST /api/v1/admin/communities
export async function createCommunity(req: Request, res: Response, next: NextFunction) {
  try {
    const { club_id, name, tenure_start, tenure_end } = req.body;
    const result = await communityService.createCommunity({
      club_id,
      name,
      tenure_start: new Date(tenure_start),
      tenure_end:   new Date(tenure_end),
      adminId:      req.user!.id,
    });
    res.status(201).json({ success: true, data: result, message: "Community created" });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/communities
export async function listCommunities(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await communityService.listCommunities();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/admin/communities/:id/generate-code
export async function generateCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { assigned_role } = req.body;
    const result = await communityService.generateCode(
      req.params.id,
      assigned_role,
      req.user!.id
    );
    res.json({
      success: true,
      data: result,
      message: "Code generated. Copy it now — it will not be shown again.",
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/admin/communities/:id/revoke-code
export async function revokeCode(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await communityService.revokeCode(req.params.id, req.user!.id);
    res.json({ success: true, data: result, message: "Code revoked" });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/communities/:id/code-usage
export async function getCodeUsage(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await communityService.getCodeUsage(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}