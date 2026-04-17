/**
 * Shared certificate utilities for OAP and GCA.
 *
 * Both programs issue cert IDs in a unified format so the same `/verify/:certId`
 * page, QR generator, and PDF template can serve both.
 */

export type CertificateProgram = "OAP" | "GCA";

export interface CertificateRecord {
  certId: string;
  qrToken: string;
  program: CertificateProgram;
  programName: string;
  recipientName: string;
  recipientEmail: string;
  organizationName?: string | null;
  status: "active" | "revoked" | "expired";
  validFrom: string; // ISO date
  validUntil: string | null; // ISO date or null = lifetime
  issuedAt: string;
  pdfUrl: string | null;
  items?: Array<{
    type: "machine" | "inspection_tool" | "machining_operation" | "safety_credential" | "course";
    label: string;
  }>;
}

/**
 * Cert ID format: PROGRAM-XXXXXX-YYYY
 *   PROGRAM = OAP | GCA
 *   XXXXXX  = base32 random (no ambiguous chars)
 *   YYYY    = year of issue
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // skip 0,O,1,I,L

export function generateCertId(program: CertificateProgram, year = new Date().getFullYear()): string {
  let body = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const b of bytes) body += ALPHABET[b % ALPHABET.length];
  return `${program}-${body}-${year}`;
}

export function isCertIdValid(id: string): boolean {
  return /^(OAP|GCA)-[A-Z0-9]{6}-\d{4}$/.test(id);
}

export function programFromCertId(id: string): CertificateProgram | null {
  if (id.startsWith("OAP-")) return "OAP";
  if (id.startsWith("GCA-")) return "GCA";
  return null;
}

export function verificationUrl(certId: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "https://jobline.ai");
  return `${base}/verify/${certId}`;
}

export function qrPayload(certId: string, qrToken: string, origin?: string): string {
  // Token is included to allow optional anti-forgery checks server-side.
  return `${verificationUrl(certId, origin)}?t=${qrToken}`;
}
