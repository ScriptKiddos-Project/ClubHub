// src/types/index.ts
import { Role } from '@prisma/client';

// ─── Auth Types ────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  type: 'access' | 'refresh';
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  is_verified: boolean;
}

// ─── Request Types ─────────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ─── API Response ──────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Pagination ────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// ─── Email ─────────────────────────────────────────────────────────────────

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailJobData {
  to: string;
  subject: string;
  templateName: 'verify-email' | 'reset-password' | 'event-confirmation' | 'event-reminder' | 'welcome-core-member';
  templateData: Record<string, string | number | boolean>;
}
