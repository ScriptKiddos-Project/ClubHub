// server/src/controllers/clubController.ts
// Thin controller: parse request → call service → format response. No DB queries here.

import { Request, Response, NextFunction } from "express";
import * as clubService from "../services/clubService";
import { ClubFilters, CreateClubInput } from "../types";
import { ClubCategory } from "@prisma/client";

// GET /api/v1/clubs
export async function listClubs(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: ClubFilters = {
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      category: req.query.category as ClubCategory | undefined,
      search: req.query.search as string | undefined,
    };

    const result = await clubService.listClubs(filters, req.user?.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/clubs/:id
export async function getClub(req: Request, res: Response, next: NextFunction) {
  try {
    const club = await clubService.getClubById(req.params.id, req.user?.id);
    res.json({ success: true, data: club });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/clubs
export async function createClub(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateClubInput = req.body;
    const club = await clubService.createClub(input, req.user!.id);
    res.status(201).json({
      success: true,
      data: club,
      message: "Club created and pending approval",
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/clubs/pending
export async function listPendingClubs(req: Request, res: Response, next: NextFunction) {
  try {
    const clubs = await clubService.listPendingClubs();
    res.json({ success: true, data: clubs, meta: { total: clubs.length } });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/admin/clubs/:id/approve
export async function approveOrRejectClub(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { approved, reason } = req.body as { approved: boolean; reason?: string };
    const result = await clubService.approveOrRejectClub(
      req.params.id,
      approved,
      reason,
      req.user!.id
    );
    res.json({
      success: true,
      data: result,
      message: approved ? "Club approved successfully" : "Club rejected",
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/clubs/:id/join
export async function joinClub(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await clubService.joinClub(req.params.id, req.user!.id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/clubs/:id/leave
export async function leaveClub(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await clubService.leaveClub(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
