import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analyticsService';

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
    const { id } = req.params;
    const data = await analyticsService.getClubAnalytics(id);
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
    const user = (req as any).user;
    const data = await analyticsService.getStudentStats(user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};