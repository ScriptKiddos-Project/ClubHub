import { Prisma, Role, suggestion_status } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';

export type SuggestionStatus = 'pending' | 'under_consideration' | 'planned' | 'rejected';

type SuggestionWithUser = Prisma.suggestionsGetPayload<{
  include: { user: { select: { id: true; name: true; avatar_url: true } } };
}>;

// ─────────────────────────────────────────────────────────────────────────────
// createSuggestion
// ─────────────────────────────────────────────────────────────────────────────
export async function createSuggestion(data: {
  clubId:  string;
  userId:  string;
  title:   string;
  body:    string;
}) {
  // Verify club exists
  const club = await prisma.club.findUnique({ where: { id: data.clubId } });
  if (!club) throw new AppError('Club not found', 404, 'CLUB_NOT_FOUND');
  if (club.status !== 'approved') {
    throw new AppError('Suggestions are only available for approved clubs', 400, 'CLUB_NOT_APPROVED');
  }

  const suggestion = await prisma.suggestions.create({
    data: {
      club_id: data.clubId,
      user_id: data.userId,
      title:   data.title,
      body:    data.body,
      status:  'pending',
    },
    include: {
      user: { select: { id: true, name: true, avatar_url: true } },
    },
  });

  return normalizeSuggestion(suggestion);
}

// ─────────────────────────────────────────────────────────────────────────────
// listSuggestions
// ─────────────────────────────────────────────────────────────────────────────
export async function listSuggestions(params: {
  clubId:  string;
  status?: SuggestionStatus;
  page?:   number;
  limit?:  number;
}) {
  const page  = params.page  ?? 1;
  const limit = params.limit ?? 50;
  const skip  = (page - 1) * limit;

  const where = {
    club_id: params.clubId,
    ...(params.status ? { status: params.status } : {}),
  };

  const [suggestions, total] = await Promise.all([
    prisma.suggestions.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatar_url: true } } },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.suggestions.count({ where }),
  ]);

  return {
    data: suggestions.map(normalizeSuggestion),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// updateSuggestionStatus — admin only
// ─────────────────────────────────────────────────────────────────────────────
export async function updateSuggestionStatus(data: {
  clubId:        string;
  suggestionId:  string;
  status:        SuggestionStatus;
  adminNote?:    string;
  actorId:       string;
  actorRole:     Role;
}) {
  const allowedStatuses: SuggestionStatus[] = ['pending', 'under_consideration', 'planned', 'rejected'];
  if (!allowedStatuses.includes(data.status)) {
    throw new AppError('Invalid suggestion status', 400, 'INVALID_STATUS');
  }

  if (data.actorRole !== 'super_admin' && data.actorRole !== 'club_admin') {
    const membership = await prisma.userClub.findUnique({
      where: {
        user_id_club_id: {
          user_id: data.actorId,
          club_id: data.clubId,
        },
      },
      select: { role: true },
    });

    if (!membership || !['secretary', 'event_manager'].includes(membership.role)) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }
  }

  const suggestion = await prisma.suggestions.findFirst({
    where: { id: data.suggestionId, club_id: data.clubId },
  });
  if (!suggestion) throw new AppError('Suggestion not found', 404, 'NOT_FOUND');

  const updated = await prisma.suggestions.update({
    where: { id: data.suggestionId },
    data: {
      status:     data.status as suggestion_status,
      admin_note: data.adminNote,
    },
    include: { user: { select: { id: true, name: true, avatar_url: true } } },
  });

  return normalizeSuggestion(updated);
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalizer
// ─────────────────────────────────────────────────────────────────────────────
function normalizeSuggestion(s: SuggestionWithUser) {
  return {
    id:        s.id,
    clubId:    s.club_id,
    userId:    s.user_id,
    user:      s.user
      ? { name: s.user.name, avatarUrl: s.user.avatar_url ?? undefined }
      : undefined,
    title:     s.title,
    body:      s.body,
    status:    s.status,
    adminNote: s.admin_note,
    createdAt: s.created_at.toISOString(),
    updatedAt: s.updated_at.toISOString(),
  };
}
