import { Request, Response } from 'express';
import {
  getRecommendationsForUser,
  invalidateRecommendationCache,
} from '../services/recommendationService';
import {
  getClubPerformanceAnalytics,
  getMemberEngagementScores,
  getCampusTrends,
} from '../services/analyticsService';
import { buildLinkedInShareUrl, buildAchievementShareUrl } from '../services/linkedinService';

export async function getRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const recommendations = await getRecommendationsForUser(userId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'RECOMMENDATION_ERROR', message: 'Failed to fetch recommendations' } });
  }
}

export async function refreshRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    await invalidateRecommendationCache(userId);
    const recommendations = await getRecommendationsForUser(userId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'RECOMMENDATION_REFRESH_ERROR', message: 'Failed to refresh recommendations' } });
  }
}

export async function getClubAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const { clubId } = req.params;
    const analytics = await getClubPerformanceAnalytics(clubId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'ANALYTICS_ERROR', message: 'Failed to fetch club analytics' } });
  }
}

export async function getEngagementScores(req: Request, res: Response): Promise<void> {
  try {
    const { clubId } = req.params;
    const scores = await getMemberEngagementScores(clubId);
    res.json({ success: true, data: scores });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'ENGAGEMENT_ERROR', message: 'Failed to fetch engagement scores' } });
  }
}

export async function getCampusTrendsHandler(req: Request, res: Response): Promise<void> {
  try {
    const trends = await getCampusTrends();
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'TRENDS_ERROR', message: 'Failed to fetch campus trends' } });
  }
}

export async function getLinkedInShareUrl(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { certificateId } = req.params;
    const shareUrl = await buildLinkedInShareUrl(userId, certificateId);
    res.json({ success: true, data: { shareUrl } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'Certificate not found or does not belong to user') {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: 'LINKEDIN_ERROR', message: 'Failed to build LinkedIn share URL' } });
  }
}

export async function getAchievementShareUrl(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { type } = req.params as { type: 'certificate' | 'badge' | 'resume' };
    if (!['certificate', 'badge', 'resume'].includes(type)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_TYPE', message: 'type must be certificate, badge, or resume' } });
      return;
    }
    const shareUrl = await buildAchievementShareUrl(userId, type);
    res.json({ success: true, data: { shareUrl } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'LINKEDIN_ERROR', message: 'Failed to build achievement share URL' } });
  }
}