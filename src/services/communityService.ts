// server/src/services/communityService.ts
// Community tenure & access code business logic — Super Admin only.

import prisma from "../config/database";
import { AppError } from "../utils/AppError";
import crypto from "crypto";

export interface CommunityListItem {
  id:           string;
  club_id:      string;
  club_name:    string;
  name:         string;
  tenure_start: Date;
  tenure_end:   Date;
  codes:        CodeSummary[];
  created_at:   Date;
}

export interface CodeSummary {
  id:            string;
  assigned_role: string;
  is_revoked:    boolean;
  usage_count:   number;
  created_at:    Date;
}

export interface CodeUsageEntry {
  id:         string;
  user_name:  string;
  user_email: string;
  used_at:    Date;
}

// ─── Create a tenure community for a club ────────────────────────────────────
export async function createCommunity(input: {
  club_id:      string;
  name:         string;
  tenure_start: Date;
  tenure_end:   Date;
  adminId:      string;
}): Promise<{ id: string; club_id: string; name: string }> {
  const club = await prisma.club.findUnique({ where: { id: input.club_id } });
  if (!club) throw new AppError("Club not found", 404, "CLUB_NOT_FOUND");

  if (new Date(input.tenure_end) <= new Date(input.tenure_start)) {
    throw new AppError("tenure_end must be after tenure_start", 400, "INVALID_TENURE");
  }

  const community = await prisma.community.create({
    data: {
      club_id:      input.club_id,
      name:         input.name,
      tenure_start: new Date(input.tenure_start),
      tenure_end:   new Date(input.tenure_end),
      created_by:   input.adminId,
    },
    select: { id: true, club_id: true, name: true },
  });

  await prisma.auditLog.create({
    data: {
      action:      "COMMUNITY_CREATED",
      actor_id:    input.adminId,
      target_type: "community",
      target_id:   community.id,
      club_id:     input.club_id,
      metadata:    { name: input.name, club_id: input.club_id },
    },
  });

  return community;
}

// ─── List all communities with their codes ────────────────────────────────────
export async function listCommunities(): Promise<CommunityListItem[]> {
  const rows = await prisma.community.findMany({
    orderBy: { created_at: "desc" },
    include: {
      club: { select: { name: true } },
      access_codes: {
        select: {
          id:            true,
          assigned_role: true,
          is_revoked:    true,
          usage_count:   true,
          created_at:    true,
        },
      },
    },
  });

  return rows.map((r) => ({
    id:           r.id,
    club_id:      r.club_id,
    club_name:    r.club.name,
    name:         r.name,
    tenure_start: r.tenure_start,
    tenure_end:   r.tenure_end,
    codes:        r.access_codes.map((c) => ({
      id:            c.id,
      assigned_role: c.assigned_role,
      is_revoked:    c.is_revoked,
      usage_count:   c.usage_count,
      created_at:    c.created_at,
    })),
    created_at: r.created_at,
  }));
}

// ─── Generate an access code for a community ─────────────────────────────────
// Returns plaintext once — only SHA-256 hash stored in DB.
export async function generateCode(
  communityId:   string,
  assigned_role: string,
  adminId:       string
): Promise<{ plaintext: string; codeId: string }> {
  const community = await prisma.community.findUnique({
    where:   { id: communityId },
    include: { club: { select: { name: true, id: true } } },
  });
  if (!community) throw new AppError("Community not found", 404, "COMMUNITY_NOT_FOUND");

  const validRoles = ["member", "secretary", "event_manager"];
  if (!validRoles.includes(assigned_role)) {
    throw new AppError(
      "Invalid role. Must be member, secretary, or event_manager",
      400,
      "INVALID_ROLE"
    );
  }

  const random    = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  const year      = new Date().getFullYear();
  const plaintext = `CDNG-${year}-${random}`;
  const hash      = crypto.createHash("sha256").update(plaintext).digest("hex");

  const code = await prisma.communityAccessCode.create({
    data: {
      community_id:  communityId,
      code_hash:     hash,
      assigned_role: assigned_role as "member" | "secretary" | "event_manager",
    },
    select: { id: true },
  });

  await prisma.auditLog.create({
    data: {
      action:      "ACCESS_CODE_GENERATED",
      actor_id:    adminId,
      target_type: "community",
      target_id:   communityId,
      club_id:     community.club.id,
      metadata:    { club_name: community.club.name, assigned_role },
    },
  });

  return { plaintext, codeId: code.id };
}

// ─── Revoke an access code ────────────────────────────────────────────────────
export async function revokeCode(
  codeId:  string,
  adminId: string
): Promise<{ id: string; is_revoked: boolean }> {
  const code = await prisma.communityAccessCode.findUnique({
    where:   { id: codeId },
    include: { community: { select: { club_id: true } } },
  });
  if (!code) throw new AppError("Access code not found", 404, "CODE_NOT_FOUND");
  if (code.is_revoked) throw new AppError("Code is already revoked", 409, "ALREADY_REVOKED");

  const updated = await prisma.communityAccessCode.update({
    where:  { id: codeId },
    data:   { is_revoked: true, revoked_at: new Date(), revoked_by: adminId },
    select: { id: true, is_revoked: true },
  });

  await prisma.auditLog.create({
    data: {
      action:      "ACCESS_CODE_REVOKED",
      actor_id:    adminId,
      target_type: "access_code",
      target_id:   codeId,
      club_id:     code.community.club_id,
      metadata:    {},
    },
  });

  return updated;
}

// ─── Get usage log for a specific code ───────────────────────────────────────
export async function getCodeUsage(codeId: string): Promise<CodeUsageEntry[]> {
  const usages = await prisma.accessCodeUsage.findMany({
    where:   { code_id: codeId },
    orderBy: { used_at: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return usages.map((u) => ({
    id:         u.id,
    user_name:  u.user.name,
    user_email: u.user.email,
    used_at:    u.used_at,
  }));
}