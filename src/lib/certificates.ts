/**
 * Shared certificate utilities for OAP and GCA.
 *
 * Both programs issue cert IDs in a unified format so the same `/verify/:certId`
 * page, QR generator, and PDF template can serve both.
 */

export type CertificateProgram = "OAP" | "GCA";

/**
 * OAP supports trade verticals beyond machining. Each vertical has a short
 * cert-ID code that lives between the program prefix and the random body:
 *   OAP-CAB-XXXXXX-2026   (Cabinetry)
 *   OAP-AUTO-XXXXXX-2026  (Automotive)
 * Legacy `OAP-XXXXXX-YYYY` (no code) is treated as Machining for back-compat.
 */
export type OapVertical =
  | "machining"
  | "cabinetry"
  | "automotive"
  | "welding"
  | "construction"
  | "electrical"
  | "plumbing"
  | "hvac"
  | "general";

export const VERTICAL_CODES: Record<OapVertical, string> = {
  machining: "MAC",
  cabinetry: "CAB",
  automotive: "AUTO",
  welding: "WELD",
  construction: "CON",
  electrical: "ELEC",
  plumbing: "PLM",
  hvac: "HVAC",
  general: "GEN",
};

const VERTICAL_FROM_CODE: Record<string, OapVertical> = Object.fromEntries(
  Object.entries(VERTICAL_CODES).map(([k, v]) => [v, k as OapVertical])
);

export interface CertificateRecord {
  certId: string;
  qrToken: string;
  program: CertificateProgram;
  programName: string;
  recipientName: string;
  recipientUsername?: string | null;
  recipientEmail: string | null;
  organizationName?: string | null;
  status: "active" | "revoked" | "expired" | "suspended";
  /**
   * Server-computed normalized status. Always trust this for trust-signal UI;
   * never re-derive expiry/revocation client-side.
   */
  effectiveStatus?: "valid" | "expired" | "revoked" | "suspended";
  revokedAt?: string | null;
  revokedReason?: string | null;
  validFrom: string; // ISO date
  validUntil: string | null; // ISO date or null = lifetime
  issuedAt: string;
  pdfUrl: string | null;
  vertical?: OapVertical;
  /** Snapshot of the signer at time of issue (mentor or certifier). */
  signedByName?: string | null;
  signedByTitle?: string | null;
  signedBySignatureUrl?: string | null;
  /** True when a Stripe checkout session paid for the certificate ($12 issuance).
   *  Digital view is always free; PDF download + Print are gated on this.
   *  Optional in the type so preview/template fixtures don't need to set it;
   *  treated as `false` (locked) when missing. */
  isPaid?: boolean;
  items?: Array<{
    type:
      | "machine"
      | "inspection_tool"
      | "machining_operation"
      | "safety_credential"
      | "course"
      | "vertical_role"
      | "trade_tool"
      | "license";
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

export function generateCertId(
  program: CertificateProgram,
  vertical: OapVertical = "machining",
  year = new Date().getFullYear()
): string {
  let body = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const b of bytes) body += ALPHABET[b % ALPHABET.length];
  // GCA stays single-segment; OAP machining stays single-segment for back-compat.
  if (program === "GCA" || vertical === "machining") {
    return `${program}-${body}-${year}`;
  }
  return `${program}-${VERTICAL_CODES[vertical]}-${body}-${year}`;
}

/** Accepts both legacy 3-segment and new 4-segment (vertical-prefixed) cert IDs. */
export function isCertIdValid(id: string): boolean {
  return /^(OAP|GCA)(-[A-Z]{2,4})?-[A-Z0-9]{6}-\d{4}$/.test(id);
}

export function programFromCertId(id: string): CertificateProgram | null {
  if (id.startsWith("OAP-")) return "OAP";
  if (id.startsWith("GCA-")) return "GCA";
  return null;
}

/** Returns the vertical encoded in a cert ID, defaulting to `machining` for legacy IDs. */
export function verticalFromCertId(id: string): OapVertical {
  const parts = id.split("-");
  // 4 segments = PROGRAM-CODE-BODY-YEAR
  if (parts.length === 4) {
    const code = parts[1];
    return VERTICAL_FROM_CODE[code] ?? "general";
  }
  return "machining";
}

export function verificationUrl(certId: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "https://jobline.ai");
  return `${base}/verify/${certId}`;
}

export function qrPayload(certId: string, qrToken: string, origin?: string): string {
  // Token is included to allow optional anti-forgery checks server-side.
  return `${verificationUrl(certId, origin)}?t=${qrToken}`;
}
