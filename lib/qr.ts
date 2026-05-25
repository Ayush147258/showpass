import QRCode from "qrcode";
import * as jose from "jose";
import { nanoid } from "nanoid";

const QR_SECRET = new TextEncoder().encode(
  process.env.QR_SECRET ?? "showpass-qr-secret-hackathon-2025"
);

export interface QRPayload {
  ticketId: string;
  eventId: string;
  tierId: string;
  attendeeEmail: string;
  issuedAt: number;
}

// Generate a signed JWT that gets encoded into QR
export async function generateQRToken(payload: QRPayload): Promise<string> {
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1y")
    .setJti(nanoid())
    .sign(QR_SECRET);
}

// Verify and decode QR token
export async function verifyQRToken(token: string): Promise<QRPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, QR_SECRET);
    return payload as unknown as QRPayload;
  } catch {
    return null;
  }
}

// Generate a QR code as a data URI (for display)
export async function generateQRDataUrl(token: string): Promise<string> {
  return await QRCode.toDataURL(token, {
    width: 256,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel: "H",
  });
}

// Generate QR as SVG string (for ticket rendering)
export async function generateQRSvg(token: string, color = "#000000"): Promise<string> {
  return await QRCode.toString(token, {
    type: "svg",
    color: { dark: color, light: "#00000000" },
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

// Generate a human-readable ticket reference
export function generateTicketRef(eventSlug: string): string {
  const code = eventSlug.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
  const year = new Date().getFullYear().toString().slice(2);
  const unique = nanoid(6).toUpperCase();
  return `SP-${code}-${year}-${unique}`;
}
