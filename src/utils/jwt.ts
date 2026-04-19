// src/utils/jwt.ts

import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { Role } from '@prisma/client';

// 🔐 Secrets
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

// ⏱ Expiry (simple + safe)
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// 🚨 Safety check
if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT secrets must be defined in environment variables');
}

// ✅ Access Token
export function signAccessToken(payload: {
  userId: string;
  email: string;
  role: Role;
}): string {
  return jwt.sign(
    { ...payload, type: 'access' } as JwtPayload,
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES as any } // 🔥 key fix
  );
}

// ✅ Refresh Token
export function signRefreshToken(payload: {
  userId: string;
  email: string;
  role: Role;
}): string {
  return jwt.sign(
    { ...payload, type: 'refresh' } as JwtPayload,
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES as any } // 🔥 key fix
  );
}

// ✅ Verify
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}

// ✅ Decode
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}