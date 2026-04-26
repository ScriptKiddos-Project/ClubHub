import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  createSuggestion,
  listSuggestions,
  SuggestionStatus,
  updateSuggestionStatus,
} from '../services/suggestionService';

// POST /api/v1/clubs/:id/suggestions
export const submitSuggestion = asyncHandler(async (req: Request, res: Response) => {
  const { title, body } = req.body;
  const suggestion = await createSuggestion({
    clubId: req.params.id,
    userId: req.user!.id,
    title,
    body,
  });

  res.status(201).json({ success: true, data: suggestion });
});

// GET /api/v1/clubs/:id/suggestions
export const getSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const status = req.query.status as SuggestionStatus | undefined;

  const result = await listSuggestions({
    clubId: req.params.id,
    status,
    page,
    limit,
  });

  res.status(200).json({ success: true, ...result });
});

// PATCH /api/v1/clubs/:id/suggestions/:suggestionId
export const patchSuggestionStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, adminNote } = req.body;
  const updated = await updateSuggestionStatus({
    clubId: req.params.id,
    suggestionId: req.params.suggestionId,
    status,
    adminNote,
    actorId: req.user!.id,
    actorRole: req.user!.role,
  });

  res.status(200).json({ success: true, data: updated });
});
