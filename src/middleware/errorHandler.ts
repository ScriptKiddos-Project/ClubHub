// server/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── AppError (thrown explicitly from services/controllers) ────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // ── Zod (safety net — validate middleware handles these first) ────────────
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Input validation failed",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    });
    return;
  }

  // ── Prisma known errors ───────────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const fields = (err.meta?.target as string[])?.join(", ") ?? "field";
        res.status(409).json({
          success: false,
          error: {
            code: "DUPLICATE_ENTRY",
            message: `A record with this ${fields} already exists`,
          },
        });
        return;
      }
      case "P2025":
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Record not found" },
        });
        return;
      case "P2003":
        res.status(400).json({
          success: false,
          error: {
            code: "FOREIGN_KEY_VIOLATION",
            message: "Referenced record does not exist",
          },
        });
        return;
      default:
        console.error("Prisma error:", err.code, err.message);
        res.status(500).json({
          success: false,
          error: { code: "DATABASE_ERROR", message: "A database error occurred" },
        });
        return;
    }
  }

  // ── JWT errors (safety net — authenticate middleware handles these first) ──
  if (err instanceof Error) {
    if (err.name === "JsonWebTokenError") {
      res.status(401).json({
        success: false,
        error: { code: "TOKEN_INVALID", message: "Invalid token" },
      });
      return;
    }
    if (err.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        error: { code: "TOKEN_EXPIRED", message: "Token has expired" },
      });
      return;
    }
  }

  // ── Unknown / unhandled ───────────────────────────────────────────────────
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : err instanceof Error ? err.message : String(err),
    },
  });
}

// ── 404 handler — register BEFORE errorHandler, AFTER all routes ──────────────
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "The requested resource was not found" },
  });
}