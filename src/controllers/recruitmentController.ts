import { Request, Response, NextFunction } from 'express';
import * as recruitmentService from '../services/recruitmentService';

export const applyToClub = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId; // JwtPayload uses userId
    const application = await recruitmentService.submitApplication(
      req.params.clubId,
      userId,
      req.body.formData
    );
    res.status(201).json({ success: true, data: application });
  } catch (err) {
    next(err);
  }
};

export const listApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applications = await recruitmentService.getApplications(req.params.clubId);
    res.json({ success: true, data: applications });
  } catch (err) {
    next(err);
  }
};

export const patchApplicationStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await recruitmentService.updateApplicationStatus(
      req.params.applicationId,
      req.body.status
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const scheduleInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId, candidateId, slotTime } = req.body;
    const interview = await recruitmentService.scheduleInterview(
      req.params.clubId,
      applicationId,
      candidateId,
      new Date(slotTime)
    );
    res.status(201).json({ success: true, data: interview });
  } catch (err) {
    next(err);
  }
};

export const patchInterviewResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await recruitmentService.updateInterviewResult(
      req.params.interviewId,
      req.body.result
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};