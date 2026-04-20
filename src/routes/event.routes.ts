// server/src/routes/event.routes.ts
// Event routes — applies middleware + maps to controllers.

import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { rbac } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createEventSchema,
  updateEventSchema,
  listEventsSchema,
  calendarEventsSchema,
  eventIdParamSchema,
} from "../validators/event.validator";
import * as eventController from "../controllers/eventController";

const router = Router();

// ─── Calendar (before /:id to avoid collision) ────────────────────────────────
// GET /api/v1/events/calendar
router.get(
  "/calendar",
  authenticate,
  validate(calendarEventsSchema),
  eventController.getCalendarEvents
);

// ─── Event CRUD ───────────────────────────────────────────────────────────────

// GET /api/v1/events
router.get(
  "/",
  authenticate,
  validate(listEventsSchema),
  eventController.listEvents
);

// POST /api/v1/events — Event Manager or Super Admin only
router.post(
  "/",
  authenticate,
  rbac("event_manager", "super_admin"),
  validate(createEventSchema),
  eventController.createEvent
);

// GET /api/v1/events/:id
router.get(
  "/:id",
  authenticate,
  validate(eventIdParamSchema),
  eventController.getEvent
);

// PUT /api/v1/events/:id — Event Manager (own events) or Super Admin
router.put(
  "/:id",
  authenticate,
  rbac("event_manager", "super_admin"),
  validate(updateEventSchema),
  eventController.updateEvent
);

// DELETE /api/v1/events/:id — Event Manager (own) or Super Admin
router.delete(
  "/:id",
  authenticate,
  rbac("event_manager", "super_admin"),
  validate(eventIdParamSchema),
  eventController.deleteEvent
);

// ─── Event Registration ───────────────────────────────────────────────────────

// POST /api/v1/events/:id/register — any authenticated user
router.post(
  "/:id/register",
  authenticate,
  validate(eventIdParamSchema),
  eventController.registerForEvent
);

// DELETE /api/v1/events/:id/register — unregister
router.delete(
  "/:id/register",
  authenticate,
  validate(eventIdParamSchema),
  eventController.unregisterFromEvent
);

export default router;