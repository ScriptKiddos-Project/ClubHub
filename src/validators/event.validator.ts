// server/src/validators/event.validator.ts
import { z } from "zod";
import { EventType } from "@prisma/client";

const eventDateSchema = z
  .string()
  .datetime({ message: "Must be a valid ISO 8601 datetime string" })
  .or(z.date());

export const createEventSchema = z.object({
  body: z.object({
    club_id: z.string().uuid("club_id must be a valid UUID"),
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title must be at most 200 characters")
      .trim(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(5000, "Description must be at most 5000 characters")
      .trim(),
    date: eventDateSchema,
    end_date: eventDateSchema.optional(),
    venue: z
      .string()
      .min(2, "Venue must be at least 2 characters")
      .max(300)
      .trim(),
    capacity: z
      .number()
      .int()
      .min(1, "Capacity must be at least 1")
      .max(100000),
    registration_deadline: eventDateSchema.optional(),
    event_type: z.nativeEnum(EventType),
    is_published: z.boolean().default(false),
    points_reward: z
      .number()
      .min(0, "Points reward cannot be negative")
      .max(1000)
      .default(0),
    volunteer_hours: z
      .number()
      .min(0, "Volunteer hours cannot be negative")
      .max(200)
      .default(0),
    tags: z
      .array(z.string().max(50).trim())
      .max(10, "Maximum 10 tags")
      .default([]),
    is_free: z.boolean().default(true),
    qr_attendance_enabled: z.boolean().default(true),
    pin_attendance_enabled: z.boolean().default(false),
    banner_url: z.string().url().optional().or(z.literal("")),
  }),
});

export const updateEventSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      title: z.string().min(3).max(200).trim().optional(),
      description: z.string().min(10).max(5000).trim().optional(),
      date: eventDateSchema.optional(),
      end_date: eventDateSchema.optional(),
      venue: z.string().min(2).max(300).trim().optional(),
      capacity: z.number().int().min(1).max(100000).optional(),
      registration_deadline: eventDateSchema.optional(),
      event_type: z.nativeEnum(EventType).optional(),
      is_published: z.boolean().optional(),
      points_reward: z.number().min(0).max(1000).optional(),
      volunteer_hours: z.number().min(0).max(200).optional(),
      tags: z.array(z.string().max(50).trim()).max(10).optional(),
      is_free: z.boolean().optional(),
      qr_attendance_enabled: z.boolean().optional(),
      pin_attendance_enabled: z.boolean().optional(),
      banner_url: z.string().url().optional().or(z.literal("")),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),
});

export const listEventsSchema = z.object({
  query: z.object({
    club_id: z.string().uuid().optional(),
    type: z.nativeEnum(EventType).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    is_published: z
      .string()
      .optional()
      .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
    is_free: z
      .string()
      .optional()
      .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
    tags: z
      .string()
      .optional()
      .transform((v) => (v ? v.split(",") : undefined)),
    skill_areas: z
      .string()
      .optional()
      .transform((v) => (v ? v.split(",") : undefined)),
    volunteer_hours_min: z.coerce.number().min(0).optional(),
    is_featured: z
      .string()
      .optional()
      .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
    search: z.string().trim().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const calendarEventsSchema = z.object({
  query: z.object({
    start: z.string().datetime({ message: "start must be ISO 8601" }),
    end: z.string().datetime({ message: "end must be ISO 8601" }),
  }),
});

export const eventIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export type CreateEventBody = z.infer<typeof createEventSchema>["body"];
export type UpdateEventBody = z.infer<typeof updateEventSchema>["body"];
export type ListEventsQuery = z.infer<typeof listEventsSchema>["query"];
