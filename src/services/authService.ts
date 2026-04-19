// src/services/authService.ts
import prisma from '../config/database';
import { hashPassword, comparePassword, hashToken, compareToken } from '../utils/bcrypt';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import {
  generateSecureToken,
  addMinutes,
  addDays,
  isExpired,
  hashSha256,
  generateAccessCode,
} from '../utils/dateUtils';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeCoreEmail,
} from './emailService';
import { createError } from '../middleware/errorHandler';
import { Role } from '@prisma/client';
import { formatDate } from '../utils/dateUtils';

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  department?: string;
  enrollment_year?: number;
  degree_type?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw createError('Email already registered', 409, 'EMAIL_TAKEN');

  const password_hash = await hashPassword(data.password);
  const verifyToken = generateSecureToken();
  const verifyExpires = addMinutes(new Date(), 60);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password_hash,
      name: data.name,
      department: data.department,
      enrollment_year: data.enrollment_year,
      degree_type: data.degree_type as never,
      email_verify_token: verifyToken,
      email_verify_expires: verifyExpires,
    },
    select: { id: true, email: true, name: true, role: true, is_verified: true },
  });

  // Send verification email (direct for registration — queue not yet set up)
  await sendVerificationEmail(user.email, user.name, verifyToken);

  return user;
}

// ─── Verify Email ─────────────────────────────────────────────────────────────

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      email_verify_token: token,
      email_verify_expires: { gt: new Date() },
    },
  });

  if (!user) throw createError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
  if (user.is_verified) throw createError('Email already verified', 400, 'ALREADY_VERIFIED');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      is_verified: true,
      email_verify_token: null,
      email_verify_expires: null,
    },
  });

  return { message: 'Email verified successfully' };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password_hash) {
    throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

  if (!user.is_verified) throw createError('Please verify your email first', 403, 'EMAIL_NOT_VERIFIED');
  if (!user.is_active) throw createError('Account is suspended', 403, 'ACCOUNT_SUSPENDED');

  const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email, role: user.role });

  // Store hashed refresh token
  const refreshTokenHash = await hashToken(refreshToken);
  await prisma.user.update({
    where: { id: user.id },
    data: { refresh_token_hash: refreshTokenHash },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'USER_LOGIN',
      actor_id: user.id,
      target_type: 'user',
      target_id: user.id,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_verified: user.is_verified,
      total_points: user.total_points,
      avatar_url: user.avatar_url,
    },
  };
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export async function refreshTokens(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw createError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }

  if (payload.type !== 'refresh') throw createError('Invalid token type', 401, 'INVALID_TOKEN');

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.refresh_token_hash) throw createError('Session not found', 401, 'SESSION_NOT_FOUND');

  const isValid = await compareToken(refreshToken, user.refresh_token_hash);
  if (!isValid) throw createError('Refresh token mismatch', 401, 'INVALID_TOKEN');

  // Rotate tokens
  const newAccessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
  const newRefreshToken = signRefreshToken({ userId: user.id, email: user.email, role: user.role });

  const newRefreshHash = await hashToken(newRefreshToken);
  await prisma.user.update({
    where: { id: user.id },
    data: { refresh_token_hash: newRefreshHash },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutUser(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refresh_token_hash: null },
  });
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) return { message: 'If that email exists, a reset link has been sent.' };

  const resetToken = generateSecureToken();
  const resetTokenHash = hashSha256(resetToken);
  const resetExpires = addMinutes(new Date(), 60);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      reset_token_hash: resetTokenHash,
      reset_token_expires: resetExpires,
    },
  });

  await sendPasswordResetEmail(user.email, user.name, resetToken);

  return { message: 'If that email exists, a reset link has been sent.' };
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashSha256(token);

  const user = await prisma.user.findFirst({
    where: {
      reset_token_hash: tokenHash,
      reset_token_expires: { gt: new Date() },
    },
  });

  if (!user) throw createError('Invalid or expired reset token', 400, 'INVALID_TOKEN');

  const password_hash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash,
      reset_token_hash: null,
      reset_token_expires: null,
      refresh_token_hash: null, // Invalidate all sessions
    },
  });

  return { message: 'Password reset successfully' };
}

// ─── Core Join ────────────────────────────────────────────────────────────────

export async function coreJoin(data: {
  name: string;
  email: string;
  club_id: string;
  access_code: string;
}) {
  // Find user
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw createError('No account found with this email. Please register first.', 404, 'USER_NOT_FOUND');
  if (!user.is_verified) throw createError('Please verify your email before joining.', 403, 'EMAIL_NOT_VERIFIED');

  // Find the club
  const club = await prisma.club.findFirst({
    where: { id: data.club_id, status: 'approved' },
  });
  if (!club) throw createError('Club not found', 404, 'CLUB_NOT_FOUND');

  // Hash the submitted code and look up
  const codeHash = hashSha256(data.access_code);

  const accessCode = await prisma.communityAccessCode.findFirst({
    where: {
      code_hash: codeHash,
      is_revoked: false,
      community: { club_id: data.club_id },
    },
    include: { community: true },
  });

  if (!accessCode) throw createError('Invalid or revoked access code', 400, 'INVALID_CODE');

  // Validate tenure window
  const now = new Date();
  if (now < accessCode.community.tenure_start) {
    throw createError('Tenure period has not started yet', 400, 'TENURE_NOT_STARTED');
  }
  if (now > accessCode.community.tenure_end) {
    throw createError('This access code has expired (tenure ended)', 400, 'TENURE_ENDED');
  }

  // Check max uses
  if (accessCode.max_uses && accessCode.usage_count >= accessCode.max_uses) {
    throw createError('This access code has reached its maximum usage limit', 400, 'CODE_MAXED');
  }

  // Check if user already used this code
  const alreadyUsed = await prisma.accessCodeUsage.findFirst({
    where: { code_id: accessCode.id, user_id: user.id },
  });
  if (alreadyUsed) throw createError('You have already used this access code', 409, 'ALREADY_USED');

  const assignedRole = accessCode.assigned_role;

  // Upsert user_clubs with new role
  await prisma.userClub.upsert({
    where: { user_id_club_id: { user_id: user.id, club_id: data.club_id } },
    update: { role: assignedRole },
    create: {
      user_id: user.id,
      club_id: data.club_id,
      role: assignedRole,
    },
  });

  // Update user's global role if it's higher
  const roleHierarchy: Record<Role, number> = {
    student: 0, member: 1, secretary: 2, event_manager: 2, club_admin: 3, super_admin: 4,
  };

  if (roleHierarchy[assignedRole] > roleHierarchy[user.role]) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: assignedRole },
    });
  }

  // Log code usage
  await prisma.accessCodeUsage.create({
    data: { code_id: accessCode.id, user_id: user.id, club_role: assignedRole },
  });

  // Increment usage count
  await prisma.communityAccessCode.update({
    where: { id: accessCode.id },
    data: { usage_count: { increment: 1 } },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'CORE_JOIN',
      actor_id: user.id,
      target_type: 'club',
      target_id: data.club_id,
      metadata: { assignedRole, codeId: accessCode.id },
    },
  });

  // Send welcome email
  await sendWelcomeCoreEmail(
    user.email,
    user.name,
    club.name,
    assignedRole,
    formatDate(accessCode.community.tenure_start),
    formatDate(accessCode.community.tenure_end)
  );

  return {
    message: 'Successfully joined as core member',
    role: assignedRole,
    club: { id: club.id, name: club.name },
  };
}

// ─── Community Management (Super Admin) ───────────────────────────────────────

export async function createCommunity(data: {
  club_id: string;
  name: string;
  tenure_start: string;
  tenure_end: string;
  created_by: string;
}) {
  const club = await prisma.club.findUnique({ where: { id: data.club_id } });
  if (!club) throw createError('Club not found', 404, 'CLUB_NOT_FOUND');

  const community = await prisma.community.create({
    data: {
      club_id: data.club_id,
      name: data.name,
      tenure_start: new Date(data.tenure_start),
      tenure_end: new Date(data.tenure_end),
      created_by: data.created_by,
    },
    include: { club: { select: { name: true } } },
  });

  return community;
}

export async function generateCode(data: {
  community_id: string;
  assigned_role: Role;
  max_uses?: number;
  created_by: string;
}) {
  const community = await prisma.community.findUnique({ where: { id: data.community_id } });
  if (!community) throw createError('Community not found', 404, 'NOT_FOUND');

  // Get club slug for prefix
  const club = await prisma.club.findUnique({ where: { id: community.club_id } });
  const plainCode = generateAccessCode(club?.slug || 'CLUB');
  const codeHash = hashSha256(plainCode);

  await prisma.communityAccessCode.create({
    data: {
      community_id: data.community_id,
      code_hash: codeHash,
      assigned_role: data.assigned_role,
      max_uses: data.max_uses,
    },
  });

  // Audit
  await prisma.auditLog.create({
    data: {
      action: 'CODE_GENERATED',
      actor_id: data.created_by,
      target_type: 'community',
      target_id: data.community_id,
      metadata: { assignedRole: data.assigned_role },
    },
  });

  // Return plaintext ONCE — not stored
  return { code: plainCode, message: 'Store this code securely — it will not be shown again.' };
}

export async function revokeCode(codeId: string, revokedBy: string) {
  const code = await prisma.communityAccessCode.findUnique({ where: { id: codeId } });
  if (!code) throw createError('Access code not found', 404, 'NOT_FOUND');
  if (code.is_revoked) throw createError('Code already revoked', 400, 'ALREADY_REVOKED');

  await prisma.communityAccessCode.update({
    where: { id: codeId },
    data: { is_revoked: true, revoked_at: new Date(), revoked_by: revokedBy },
  });

  return { message: 'Access code revoked successfully' };
}

export async function getCodeUsage(communityId: string) {
  const usages = await prisma.accessCodeUsage.findMany({
    where: { code: { community_id: communityId } },
    include: {
      user: { select: { name: true, email: true } },
      code: { select: { assigned_role: true, is_revoked: true } },
    },
    orderBy: { used_at: 'desc' },
  });
  return usages;
}
