// src/utils/dateUtils.ts
import crypto from 'crypto';

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function isExpired(date: Date): boolean {
  return date < new Date();
}

export function formatDate(date: Date): string {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateNumericPin(digits = 6): string {
  const max = Math.pow(10, digits);
  const min = Math.pow(10, digits - 1);
  return String(Math.floor(Math.random() * (max - min)) + min);
}

export function generateAccessCode(clubPrefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomPart = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${clubPrefix.toUpperCase().slice(0, 4)}-${new Date().getFullYear()}-${randomPart}`;
}

export function hashSha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
