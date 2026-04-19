// server/src/controllers/eventController.ts
// Thin controller: parse request → call service → format response.

import { Request, Response, NextFunction } from "express";
import * as eventService from "../services/eventService";
import { CreateEventInput, EventFilters, UpdateEventInput } from "../types";
import { EventType, Role } from "@prisma/client";

// GET /api/v1/events
export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const filters: EventFilters = {
      club_id: req.query.club_id as string | undefined,
      type: req.query.type as EventType | undefined,
      date_from: req.query.date_from as string | undefined,
      date_to: req.query.date_to as string | undefined,
      is_published:
        req.query.is_published === "true"
          ? true
          : req.query.is_published === "false"
          ? false
          : undefined,
      is_free:
        req.query.is_free === "true"
          ? true
          : req.query.is_free === "false"
          ? false
          : undefined,
      tags: req.query.tags
        ? (req.query.tags as string).split(",")
        : undefined,
      cursor: req.query.cursor as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    };

    const result = await eventService.listEvents(filters, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/events/:id
export async function getEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await eventService.getEventById(req.params.id, req.user?.id);
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/events
export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const input: CreateEventInput = req.body;
    const event = await eventService.createEvent(
      input,
      req.user!.id,
      req.user!.role as Role
    );
    res.status(201).json({
      success: true,
      data: event,
      message: "Event created successfully",
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/events/:id
export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const input: UpdateEventInput = req.body;
    const event = await eventService.updateEvent(
      req.params.id,
      input,
      req.user!.id,
      req.user!.role as Role
    );
    res.json({ success: true, data: event, message: "Event updated successfully" });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/events/:id
export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await eventService.deleteEvent(
      req.params.id,
      req.user!.id,
      req.user!.role as Role
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/events/:id/register
export async function registerForEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await eventService.registerForEvent(
      req.params.id,
      req.user!.id
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/events/:id/register
export async function unregisterFromEvent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await eventService.unregisterFromEvent(
      req.params.id,
      req.user!.id
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/events/calendar
export async function getCalendarEvents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { start, end } = req.query as { start: string; end: string };
    const result = await eventService.getEventsForCalendar(
      start,
      end,
      req.user!.id
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/users/me/dashboard
export async function getStudentDashboard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await eventService.getStudentDashboard(req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
