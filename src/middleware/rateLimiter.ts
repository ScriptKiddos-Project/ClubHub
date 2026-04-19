// server/src/middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

const isProd = process.env.NODE_ENV === "production";

// Consistent 429 response handler — guarantees status code and matches error shape
const handler = (_req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please slow down and try again shortly.",
    },
  });
};

// ── Auth routes — 10/15min prod, 100/15min dev ────────────────────────────────
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 100,
  handler,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Core-join — 5/hour prod, 50/hour dev (most sensitive endpoint) ────────────
export const coreJoinRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 5 : 50,
  handler,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Event registration — 20/15min prod, 200/15min dev ─────────────────────────
export const registrationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 20 : 200,
  handler,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── QR attendance — per user+IP, not per IP (campus shared WiFi) ──────────────
export const qrAttendanceRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProd ? 10 : 100,
  keyGenerator: (req) => `${req.ip}:${req.user?.id ?? "anon"}`,
  handler,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── PIN attendance — per user+IP+event (brute-force on 4-6 digit PIN) ─────────
// Redis incrementWithTTL is the primary brute-force guard; this is outer defense
export const pinAttendanceRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 100,
  keyGenerator: (req) => `${req.ip}:${req.user?.id ?? "anon"}:${req.params.id}`,
  handler,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── QR/PIN generation (secretary) — 20/5min prod, 200/5min dev ───────────────
export const generateRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isProd ? 20 : 200,
  keyGenerator: (req) => `${req.ip}:${req.user?.id ?? "anon"}`,
  handler,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Notification reads — per user, light limit ────────────────────────────────
export const notificationRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProd ? 100 : 1000,
  keyGenerator: (req) => `${req.ip}:${req.user?.id ?? "anon"}`,
  handler,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── General API — outermost defense, applied globally in index.ts ─────────────
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 200 : 2000,
  handler,
  standardHeaders: true,
  legacyHeaders: false,
});