// server/src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";

import { generalRateLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes         from "./routes/auth.routes";
import clubRoutes         from "./routes/club.routes";
import eventRoutes        from "./routes/event.routes";
import attendanceRoutes   from "./routes/attendance.routes";
import notificationRoutes from "./routes/notification.routes";
import adminRoutes        from "./routes/admin.routes";
import userRoutes         from "./routes/user.routes";

// ── Bull Queue Workers (import to register processors) ────────────────────────
// These must be imported here so Bull workers start with the server.
// No workers = emails never send, reminders never fire.
import "./jobs/emailWorker";
import "./jobs/notificationWorker";
import "./jobs/reminderWorker";

const app = express();

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        imgSrc:     ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'"],
      },
    },
    hsts:       { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: "deny" },
    noSniff:    true,
    xssFilter:  true,
  })
);

// ── CORS — multi-origin for dev + prod simultaneously ─────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no-origin requests (Postman, mobile apps, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials:    true,
    methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Request Logging ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── Global Rate Limiter ───────────────────────────────────────────────────────
app.use("/api/", generalRateLimiter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  const checks: Record<string, string> = {};

  // DB — uses singleton, no new connections
  try {
    const { default: prisma } = await import("./config/database");
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  // Redis
  try {
    const { getRedis } = await import("./config/redis");
    const pong = await getRedis().ping();
    checks.redis = pong === "PONG" ? "ok" : "error";
  } catch {
    checks.redis = "error";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");

  res.status(allOk ? 200 : 503).json({
    success: true,
    data: {
      status:         allOk ? "healthy" : "degraded",
      uptime_seconds: Math.floor(process.uptime()),
      timestamp:      new Date().toISOString(),
      services:       checks,
    },
  });
});

// ── API Routes (v1) ───────────────────────────────────────────────────────────
app.use("/api/v1/auth",          authRoutes);
app.use("/api/v1/clubs",         clubRoutes);
app.use("/api/v1/events",        eventRoutes);
app.use("/api/v1/events",        attendanceRoutes);   // Phase 1C: /events/:id/qr-code etc.
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/admin",         adminRoutes);
app.use("/api/v1/users",         userRoutes);

// ── 404 + Error Handling (must be last) ───────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;