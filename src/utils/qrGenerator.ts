// src/utils/qrGenerator.ts
import crypto from 'crypto';
import QRCode from 'qrcode';

const HMAC_SECRET = process.env.QR_HMAC_SECRET!;

export interface QrPayload {
  eventId: string;
  qrCodeId: string;
  validFrom: number; // Unix timestamp ms
  validUntil: number;
}

export function generateHmacSignature(payload: QrPayload): string {
  const data = `${payload.eventId}:${payload.qrCodeId}:${payload.validFrom}:${payload.validUntil}`;
  return crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
}

export function verifyHmacSignature(payload: QrPayload, signature: string): boolean {
  const expected = generateHmacSignature(payload);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function buildQrData(payload: QrPayload, signature: string): string {
  return JSON.stringify({ ...payload, sig: signature });
}

export function parseQrData(qrData: string): { payload: QrPayload; sig: string } | null {
  try {
    const parsed = JSON.parse(qrData);
    const { sig, ...payload } = parsed;
    return { payload, sig };
  } catch {
    return null;
  }
}

export async function generateQrCodeImage(data: string): Promise<string> {
  // Returns base64 PNG data URL
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: { dark: '#1f2937', light: '#ffffff' },
  });
}

export function isQrCodeExpired(validUntil: number): boolean {
  return Date.now() > validUntil;
}

export function isQrCodeNotYetActive(validFrom: number): boolean {
  return Date.now() < validFrom;
}
