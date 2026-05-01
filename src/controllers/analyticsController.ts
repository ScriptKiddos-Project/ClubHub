import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analyticsService';
import { AuthenticatedUser } from '../types';
// ADD this import at the top of analyticsController.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getGlobalAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await analyticsService.getGlobalAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};


export const getClubAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id: clubId } = req.params;
    const user = req.user as AuthenticatedUser | undefined;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // super_admin can see any club's analytics
    if (user.role !== 'super_admin') {
      // Check if the user is a member of this specific club
      const membership = await prisma.userClub.findUnique({
        where: { user_id_club_id: { user_id: user.id, club_id: clubId } },
        select: { user_id: true },
      });

      if (!membership) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You must be a member of this club to view its analytics.',
        });
        return;
      }

      // Members can view, but only secretary/event_manager/club_admin can see full analytics
      // (optional: if you want to restrict further beyond just membership)
    }

    const data = await analyticsService.getClubAnalytics(clubId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getStudentStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthenticatedUser | undefined;
    if (!user) {
      next(new Error('User not authenticated'));
      return;
    }
    const data = await analyticsService.getStudentStats(user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};