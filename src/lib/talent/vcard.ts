/**
 * Build & download vCard 3.0 strings for talent / business-card pages.
 * Spec: https://datatracker.ietf.org/doc/html/rfc2426
 */

export interface VCardInput {
  fullName: string;
  firstName?: string;
  lastName?: string;
  title?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  addressCity?: string | null;
  addressRegion?: string | null;
  addressCountry?: string | null;
  /** Public profile URL — embedded as URL line + NOTE for QR scanners that don't dial. */
  profileUrl?: string | null;
}

const escape = (v: string): string =>
  v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

export function buildVCard(input: VCardInput): string {
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

  const last = input.lastName ?? input.fullName.split(" ").slice(-1)[0] ?? "";
  const first = input.firstName ?? input.fullName.split(" ").slice(0, -1).join(" ") ?? "";
  lines.push(`N:${escape(last)};${escape(first)};;;`);
  lines.push(`FN:${escape(input.fullName)}`);

  if (input.title) lines.push(`TITLE:${escape(input.title)}`);
  if (input.company) lines.push(`ORG:${escape(input.company)}`);
  if (input.email) lines.push(`EMAIL;TYPE=INTERNET,PREF:${escape(input.email)}`);
  if (input.phone) lines.push(`TEL;TYPE=CELL,VOICE:${escape(input.phone)}`);
  if (input.website) lines.push(`URL:${escape(input.website)}`);
  if (input.profileUrl) lines.push(`URL;TYPE=WORK:${escape(input.profileUrl)}`);

  if (input.addressCity || input.addressRegion || input.addressCountry) {
    lines.push(
      `ADR;TYPE=WORK:;;${escape(input.addressCity ?? "")};${escape(
        input.addressRegion ?? ""
      )};;;${escape(input.addressCountry ?? "")}`
    );
  }

  if (input.profileUrl) lines.push(`NOTE:${escape("View full profile: " + input.profileUrl)}`);

  lines.push("REV:" + new Date().toISOString());
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function downloadVCard(input: VCardInput, filename?: string): void {
  const vcf = buildVCard(input);
  const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = (input.fullName || "contact").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  a.href = url;
  a.download = filename ?? `${safe}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
