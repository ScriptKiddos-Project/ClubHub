// server/src/utils/qrUtils.ts
import crypto from "crypto";
import QRCode from "qrcode";
import { QRCodePayload } from "../types";

// ── Secret validation — fail at startup, not at runtime ──────────────────────
const QR_SECRET = process.env.QR_HMAC_SECRET;
if (!QR_SECRET) {
  throw new Error("QR_HMAC_SECRET environment variable is not set");
}

// ── HMAC signing ──────────────────────────────────────────────────────────────
// JSON.stringify prevents delimiter-collision attacks from field values

export function signQRPayload(payload: QRCodePayload): string {
  return crypto
    .createHmac("sha256", QR_SECRET!)
    .update(JSON.stringify(payload))
    .digest("hex");
}

export function verifyQRSignature(
  payload: QRCodePayload,
  signature: string
): boolean {
  const expected = signQRPayload(payload);
  // timingSafeEqual prevents timing attacks — always use for signature comparison
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}

// ── Payload builder — call once per QR generation cycle ──────────────────────

export function buildQRPayload(
  eventId: string,
  windowMinutes = 60
): { payload: QRCodePayload; signature: string } {
  const now = Math.floor(Date.now() / 1000); // Unix seconds
  const payload: QRCodePayload = {
    eventId,
    qrCodeId:   crypto.randomUUID(),
    validFrom:  now,
    validUntil: now + windowMinutes * 60,
    version:    1,
  };
  return { payload, signature: signQRPayload(payload) };
}

// ── Encoding — base64url is compact and URL-safe (no +/= chars) ──────────────
// Shorter string → denser QR → faster camera scan from distance

export function encodeQRData(
  payload: QRCodePayload,
  signature: string
): string {
  return Buffer.from(JSON.stringify({ payload, signature }))
    .toString("base64url");
}

export function decodeQRData(
  raw: string
): { payload: QRCodePayload; signature: string } | null {
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    return null; // malformed QR data — treat as invalid
  }
}

// ── Time window validation ────────────────────────────────────────────────────

export function isQRTimeWindowValid(payload: QRCodePayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= payload.validFrom && now <= payload.validUntil;
}

// ── QR image generation ───────────────────────────────────────────────────────
// errorCorrectionLevel "H" = 30% damage tolerance, good for projection on screen

export async function generateQRCodeImage(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 400,
    color: { dark: "#1f2937", light: "#ffffff" },
  });
}

// ── PIN helpers ───────────────────────────────────────────────────────────────
// crypto.randomInt is cryptographically secure — never use Math.random() for PINs

export function generatePIN(length: 4 | 5 | 6 = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
}

export function hashPIN(pin: string): string {
  return crypto
    .createHmac("sha256", QR_SECRET!)
    .update(pin)
    .digest("hex");
}

export function verifyPIN(pin: string, storedHash: string): boolean {
  const expected = hashPIN(pin);
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(storedHash, "hex")
  );
}