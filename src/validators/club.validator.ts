// server/src/validators/club.validator.ts
import { z } from "zod";
import { ClubCategory } from "@prisma/client";

export const createClubSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Club name must be at least 2 characters")
      .max(100, "Club name must be at most 100 characters")
      .trim(),
    slug: z
      .string()
      .min(2)
      .max(60)
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must contain only lowercase letters, numbers, and hyphens"
      )
      .trim(),
    description: z.string().max(2000).optional(),
    category: z.nativeEnum(ClubCategory),
    logo_url: z.string().url().optional().or(z.literal("")),
    banner_url: z.string().url().optional().or(z.literal("")),
    website_url: z.string().url().optional().or(z.literal("")),
    instagram_url: z.string().url().optional().or(z.literal("")),
    linkedin_url: z.string().url().optional().or(z.literal("")),
    twitter_url: z.string().url().optional().or(z.literal("")),
  }),
});

export const approveClubSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    approved: z.boolean(),
    reason: z.string().max(500).optional(),
  }),
});

export const joinLeaveClubSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listClubsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category: z.nativeEnum(ClubCategory).optional(),
    search: z.string().max(100).optional(),
  }),
});

export const clubIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export type CreateClubBody = z.infer<typeof createClubSchema>["body"];
export type ApproveClubBody = z.infer<typeof approveClubSchema>["body"];
