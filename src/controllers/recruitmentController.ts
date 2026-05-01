import { Request, Response, NextFunction } from "express";
import * as recruitmentService from "../services/recruitmentService";

export const applyToClub = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id; // JwtPayload uses userId
    const application = await recruitmentService.submitApplication(
      req.params.clubId,
      userId,
      req.body.formData,
    );
    res.status(201).json({ success: true, data: application });
  } catch (err) {
    next(err);
  }
};

export const listApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const applications = await recruitmentService.getApplications(
      req.params.clubId,
    );
    res.json({ success: true, data: applications });
  } catch (err) {
    next(err);
  }
};

export const patchApplicationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const updated = await recruitmentService.updateApplicationStatus(
      req.params.applicationId,
      req.body.status,
      req.body.notes, // now passed through after validator allows it
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const scheduleInterview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      applicationId,
      candidateId,
      slotTime,
      durationMins,
      location,
      meetLink,
    } = req.body;
    const interview = await recruitmentService.scheduleInterview(
      req.params.clubId,
      applicationId,
      candidateId,
      new Date(slotTime),
      durationMins,
      location,
      meetLink,
    );
    res.status(201).json({ success: true, data: interview });
  } catch (err) {
    next(err);
  }
};

export const patchInterviewResult = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await recruitmentService.updateInterviewResult(
      req.params.interviewId,
      req.body.result,
      req.body.notes,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getForm = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const form = await recruitmentService.getRecruitmentForm(req.params.clubId);
    res.json({ success: true, data: form });
  } catch (err) {
    next(err);
  }
};

export const upsertForm = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const form = await recruitmentService.upsertRecruitmentForm(
      req.params.clubId,
      req.body,
    );
    res.json({ success: true, data: form });
  } catch (err) {
    next(err);
  }
};

export const listInterviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const interviews = await recruitmentService.getInterviews(
      req.params.clubId,
    );
    res.json({ success: true, data: interviews });
  } catch (err) {
    next(err);
  }
};

export const getMyApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const app = await recruitmentService.getMyApplication(
      req.params.clubId,
      req.user!.id,
    );
    res.json({ success: true, data: app ?? null });
  } catch (err) {
    next(err);
  }
};
