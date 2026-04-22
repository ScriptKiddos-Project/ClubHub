// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/response";
import { AuthenticatedUser } from "../types";

// Must be set — missing secret is a fatal misconfiguration, not a fallback
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
if (!JWT_ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET environment variable is not set");
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as AuthenticatedUser & {
      iat: number;
      exp: number;
    };

    // Explicitly extract — don't leak iat/exp/other claims into req.user
    req.user = {
      id: (payload as AuthenticatedUser & { userId?: string }).userId ?? payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };

    next();
  } catch (err: Error | unknown) {
    // Distinguish expired vs invalid — frontend Axios interceptor depends on this
    const error = err instanceof Error ? err : new Error(String(err));
    if ('name' in error && error.name === "TokenExpiredError") {
      sendError(res, 401, "TOKEN_EXPIRED", "Access token has expired");
      return;
    }
    sendError(res, 401, "TOKEN_INVALID", "Invalid access token");
  }
};

export const authenticateOptional = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as AuthenticatedUser & {
      iat: number;
      exp: number;
    };

    req.user = {
      id: (payload as AuthenticatedUser & { userId?: string }).userId ?? payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
  } catch {
    req.user = undefined;
  }

  next();
};
