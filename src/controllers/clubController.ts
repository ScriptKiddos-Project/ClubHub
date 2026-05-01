// server/src/controllers/clubController.ts
// Thin controller: parse request → call service → format response. No DB queries here
// EXCEPT for the new member-management endpoints which are simple enough to stay here.

import { Request, Response, NextFunction } from "express";
import * as clubService from "../services/clubService";
import { ClubFilters, CreateClubInput } from "../types";
import { ClubCategory, ClubMemberRole } from "@prisma/client";
import prisma from "../config/database";
import { sendClubInviteEmail } from "../services/emailService";

// ─── Existing handlers (unchanged) ───────────────────────────────────────────

// GET /api/v1/clubs
export async function listClubs(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: ClubFilters = {
      page:     Number(req.query.page  ?? 1),
      limit:    Number(req.query.limit ?? 20),
      category: req.query.category as ClubCategory | undefined,
      search:   req.query.search   as string       | undefined,
    };
    const result = await clubService.listClubs(filters, req.user?.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/clubs  — all clubs, all statuses (Super Admin only)
export async function listAllClubs(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: ClubFilters = {
      page:     Number(req.query.page  ?? 1),
      limit:    Number(req.query.limit ?? 20),
      category: req.query.category as ClubCategory | undefined,
      search:   req.query.search   as string       | undefined,
    };
    const result = await clubService.listAllClubs(filters);
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

// PUT /api/v1/admin/clubs/:id
export async function updateClub(req: Request, res: Response, next: NextFunction) {
  try {
    const input: Partial<CreateClubInput> = req.body;
    const result = await clubService.updateClub(req.params.id, input, req.user!.id);
    res.json({ success: true, data: result, message: "Club updated successfully" });
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
export async function approveOrRejectClub(req: Request, res: Response, next: NextFunction) {
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

// ─── New member-management handlers ──────────────────────────────────────────

// GET /api/v1/clubs/my
export async function getMyClubs(req: Request, res: Response, next: NextFunction) {
  try {
    const memberships = await prisma.userClub.findMany({
      where: { user_id: req.user!.id },
      include: {
        club: {
          select: {
            id:          true,
            name:        true,
            description: true,
            category:    true,
            logo_url:    true,
            status:      true,
          },
        },
      },
      orderBy: { joined_at: "asc" },
    });

    const data = memberships.map((m) => ({
      id:          m.club.id,
      name:        m.club.name,
      description: m.club.description,
      category:    m.club.category,
      logoUrl:     m.club.logo_url,
      role:        m.role,
      isJoined:    true,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/clubs/:id/members
export async function getClubMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const clubId = req.params.id;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true },
    });
    if (!club) {
      res.status(404).json({ success: false, message: "Club not found" });
      return;
    }

    const memberships = await prisma.userClub.findMany({
      where: { club_id: clubId },
      include: {
        user: {
          select: {
            id:           true,
            name:         true,
            email:        true,
            department:   true,
            avatar_url:   true,
            total_points: true,
          },
        },
      },
      orderBy: { joined_at: "asc" },
    });

    const memberData = await Promise.all(
      memberships.map(async (m) => {
        const attendanceCount = await prisma.attendanceLog.count({
          where: {
            user_id:    m.user_id,
            new_status: "present",
            event: { club_id: clubId },
          },
        });

        return {
          id:             m.user_id,
          role:           m.role,
          joinedAt:       m.joined_at,
          attendanceCount,
          user: {
            name:         m.user.name,
            email:        m.user.email,
            department:   m.user.department,
            avatarUrl:    m.user.avatar_url,
            total_points: m.user.total_points,
          },
        };
      })
    );

    res.json({
      success: true,
      data: {
        members: memberData,
        club:    { id: club.id, name: club.name },
      },
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/clubs/:id/members/:memberId/role  (super_admin only)
export async function updateMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.body as { role: ClubMemberRole };

    const validRoles: ClubMemberRole[] = ["member", "secretary", "event_manager"];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
      return;
    }

    const updated = await prisma.userClub.update({
      where: {
        user_id_club_id: {
          user_id: req.params.memberId,
          club_id: req.params.id,
        },
      },
      data: { role },
      select: {
        user_id:   true,
        club_id:   true,
        role:      true,
        joined_at: true,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2025") {
      res.status(404).json({ success: false, message: "Member not found in this club" });
      return;
    }
    next(err);
  }
}

// DELETE /api/v1/clubs/:id/members/:memberId  (super_admin only)
export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.userClub.delete({
      where: {
        user_id_club_id: {
          user_id: req.params.memberId,
          club_id: req.params.id,
        },
      },
    });

    res.json({ success: true, message: "Member removed from club" });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2025") {
      res.status(404).json({ success: false, message: "Member not found in this club" });
      return;
    }
    next(err);
  }
}

// POST /api/v1/clubs/:id/members/invite  (super_admin only)
// Role is always forced to "member" regardless of what the caller sends — business rule.
export async function inviteMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body as { email: string; role?: string };
    const clubId    = req.params.id;

    // 1. Resolve inviting admin's display name for the notification email
    const inviter = await prisma.user.findUnique({
      where:  { id: req.user!.id },
      select: { name: true },
    });

    // 2. Verify club exists
    const club = await prisma.club.findUnique({
      where:  { id: clubId },
      select: { id: true, name: true },
    });
    if (!club) {
      res.status(404).json({ success: false, message: "Club not found" });
      return;
    }

    // 3. Find invitee — 404 if not yet registered
    const invitee = await prisma.user.findUnique({
      where:  { email },
      select: { id: true, name: true, email: true },
    });
    if (!invitee) {
      res.status(404).json({
        success: false,
        message: "No account found for that email. The user must register first.",
      });
      return;
    }

    // 4. Guard: already a member?
    const existing = await prisma.userClub.findUnique({
      where: {
        user_id_club_id: { user_id: invitee.id, club_id: clubId },
      },
    });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `${invitee.name} is already a member of this club`,
      });
      return;
    }

    // 5. Create membership — role is always "member" (silently ignore any role sent by caller)
    const membership = await prisma.userClub.create({
      data: {
        user_id: invitee.id,
        club_id: clubId,
        role:    "member",
      },
      select: {
        user_id:   true,
        club_id:   true,
        role:      true,
        joined_at: true,
      },
    });

    // 6. Fire-and-forget email — membership is already committed so a mail
    //    failure should not roll back or block the response.
    sendClubInviteEmail({
      to:            invitee.email,
      userName:      invitee.name,
      clubName:      club.name,
      invitedByName: inviter?.name ?? "A club admin",
    }).catch((mailErr) =>
      console.error(`⚠️  Invite email failed for ${invitee.email}:`, mailErr)
    );

    res.status(201).json({
      success: true,
      data:    membership,
      message: `${invitee.name} added to ${club.name} and notified by email`,
    });
  } catch (err) {
    next(err);
  }
}