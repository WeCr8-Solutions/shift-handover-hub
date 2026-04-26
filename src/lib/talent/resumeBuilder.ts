/**
 * Generates a polished, layout-matched PDF résumé from an operator's structured
 * profile data. The layout mirrors the reference template:
 *
 *   Name (large)
 *   email · phone · linkedin · website
 *   ── divider ──
 *   Summary
 *   Experience (each role with bulleted highlights)
 *   Education
 *   Licenses & Certifications
 *   Skills
 *   Honors & Awards
 *
 * Implementation notes:
 * - Uses jsPDF (already in deps) so this runs entirely client-side.
 * - Pure rendering. No DB writes happen here — the caller decides whether to
 *   upload the resulting Blob to storage as the operator's active resume.
 */

import { jsPDF } from "jspdf";
import type {
  OperatorProfileRow,
  OperatorCertRow,
  OperatorSkillRow,
  OperatorWorkHistoryRow,
  OperatorEducationRow,
} from "@/hooks/useOperatorProfile";

export interface BuildResumeInput {
  fullName: string;
  profile: OperatorProfileRow;
  workHistory: OperatorWorkHistoryRow[];
  education: OperatorEducationRow[];
  certifications: OperatorCertRow[];
  skills: OperatorSkillRow[];
}

const PAGE_W = 8.5 * 72; // 612 pt — US Letter
const PAGE_H = 11 * 72; // 792 pt
const MARGIN_X = 54; // 0.75"
const MARGIN_TOP = 54;
const MARGIN_BOTTOM = 54;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

/** Format a date range as e.g. "May 2025 – Present" or "Feb 2019 – Dec 2021". */
function formatRange(start: string | null, end: string | null, isCurrent: boolean): string {
  const fmt = (iso: string | null): string | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString("en-US", { month: "short", year: "numeric" });
  };
  const s = fmt(start);
  const e = isCurrent ? "Present" : fmt(end);
  if (s && e) return `${s} – ${e}`;
  return s ?? e ?? "";
}

/**
 * Splits a job description into individual bullet lines. The autofill flow stores
 * descriptions either as bulleted lists ("- foo") or as free-form prose; we
 * normalize either shape into a clean bullet array.
 */
function splitBullets(desc: string | null): string[] {
  if (!desc) return [];
  const lines = desc.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
  // Strip leading bullet glyphs / hyphens / asterisks.
  return lines.map((l) => l.replace(/^([*•\-–]\s*|\d+[.)]\s*)/, "").trim()).filter(Boolean);
}

export function buildResumePdf(input: BuildResumeInput): Blob {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  let y = MARGIN_TOP;

  /** Add a new page and reset y to top margin. */
  const newPage = () => {
    addFooter(doc, input.fullName, input.profile.contact_email);
    doc.addPage();
    y = MARGIN_TOP;
  };

  /** Ensure at least `needed` pt remain on the page; otherwise paginate. */
  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_H - MARGIN_BOTTOM - 24 /* footer reserve */) newPage();
  };

  /** Wrapped paragraph text. Returns final y. */
  const writeParagraph = (text: string, opts: { size?: number; lineGap?: number; bold?: boolean; color?: [number, number, number] } = {}) => {
    const size = opts.size ?? 10;
    const lineGap = opts.lineGap ?? 3;
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    if (opts.color) doc.setTextColor(...opts.color);
    else doc.setTextColor(34, 34, 34);
    const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
    for (const line of lines) {
      ensureSpace(size + lineGap);
      doc.text(line, MARGIN_X, y);
      y += size + lineGap;
    }
  };

  const writeSectionHeader = (label: string) => {
    ensureSpace(28);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text(label.toUpperCase(), MARGIN_X, y);
    y += 4;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.6);
    doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
    y += 12;
  };

  // ── Header: Name ───────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 15, 15);
  doc.text(input.fullName, MARGIN_X, y);
  y += 22;

  // ── Header: Contact line ───────────────────────────────────────────────────
  const contactBits: string[] = [];
  if (input.profile.contact_email) contactBits.push(input.profile.contact_email);
  if (input.profile.contact_phone) contactBits.push(input.profile.contact_phone);
  if (input.profile.linkedin_url) contactBits.push(input.profile.linkedin_url.replace(/^https?:\/\//, ""));
  if (input.profile.website_url) contactBits.push(input.profile.website_url.replace(/^https?:\/\//, ""));
  else if (input.profile.portfolio_url) contactBits.push(input.profile.portfolio_url.replace(/^https?:\/\//, ""));
  if (contactBits.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const contactLines = doc.splitTextToSize(contactBits.join("  ·  "), CONTENT_W) as string[];
    for (const line of contactLines) {
      doc.text(line, MARGIN_X, y);
      y += 12;
    }
  }

  // Optional location line
  const locBits = [input.profile.location_city, input.profile.location_region, input.profile.location_country]
    .filter(Boolean)
    .join(", ");
  if (locBits) {
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(locBits, MARGIN_X, y);
    y += 12;
  }

  y += 4;
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(1);
  doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
  y += 12;

  // ── Summary ────────────────────────────────────────────────────────────────
  if (input.profile.bio) {
    writeSectionHeader("Summary");
    writeParagraph(input.profile.bio, { size: 10, lineGap: 3 });
  }

  // ── Experience ─────────────────────────────────────────────────────────────
  if (input.workHistory.length) {
    writeSectionHeader("Experience");
    const sorted = [...input.workHistory].sort((a, b) => {
      const ad = a.start_date ?? "";
      const bd = b.start_date ?? "";
      return bd.localeCompare(ad);
    });
    for (const job of sorted) {
      ensureSpace(48);
      // Job title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(20, 20, 20);
      doc.text(job.job_title, MARGIN_X, y);
      y += 14;
      // Employer + location
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const empLine = [job.employer_name, job.location].filter(Boolean).join(" · ");
      if (empLine) {
        doc.text(empLine, MARGIN_X, y);
        y += 12;
      }
      // Date range
      const range = formatRange(job.start_date, job.end_date, job.is_current);
      if (range) {
        doc.setFontSize(9.5);
        doc.setTextColor(110, 110, 110);
        doc.text(range, MARGIN_X, y);
        y += 12;
      }

      // Bulleted highlights
      const bullets = splitBullets(job.description);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(34, 34, 34);
      for (const b of bullets) {
        const wrapped = doc.splitTextToSize(b, CONTENT_W - 14) as string[];
        ensureSpace(wrapped.length * 12 + 2);
        // Bullet glyph
        doc.text("•", MARGIN_X + 2, y);
        // First line aligned with bullet
        doc.text(wrapped[0], MARGIN_X + 14, y);
        y += 12;
        for (let i = 1; i < wrapped.length; i++) {
          ensureSpace(12);
          doc.text(wrapped[i], MARGIN_X + 14, y);
          y += 12;
        }
      }
      y += 8;
    }
  }

  // ── Education ──────────────────────────────────────────────────────────────
  if (input.education.length) {
    writeSectionHeader("Education");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const ed of input.education) {
      ensureSpace(36);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text(ed.school_name, MARGIN_X, y);
      y += 13;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const degree = [ed.degree, ed.field_of_study].filter(Boolean).join(", ");
      if (degree) {
        doc.text(degree, MARGIN_X, y);
        y += 12;
      }
      const range = formatRange(ed.start_date, ed.end_date, false);
      if (range) {
        doc.setFontSize(9.5);
        doc.setTextColor(110, 110, 110);
        doc.text(range, MARGIN_X, y);
        y += 12;
        doc.setFontSize(10);
      }
      y += 4;
    }
  }

  // ── Licenses & Certifications ──────────────────────────────────────────────
  // Awards stored as certs (issuer contains "Award" or name contains "Award")
  // are routed to the Honors section instead.
  const isAward = (c: OperatorCertRow) =>
    /award|honor|mvp|recognition/i.test(c.name) || /award|honor/i.test(c.issuer ?? "");
  const realCerts = input.certifications.filter((c) => !isAward(c));
  const awards = input.certifications.filter(isAward);

  if (realCerts.length) {
    writeSectionHeader("Licenses & Certifications");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(34, 34, 34);
    for (const c of realCerts) {
      const issuer = c.issuer ? ` — ${c.issuer}` : "";
      const text = `${c.name}${issuer}`;
      const wrapped = doc.splitTextToSize(text, CONTENT_W - 14) as string[];
      ensureSpace(wrapped.length * 12);
      doc.text("•", MARGIN_X + 2, y);
      doc.text(wrapped[0], MARGIN_X + 14, y);
      y += 12;
      for (let i = 1; i < wrapped.length; i++) {
        ensureSpace(12);
        doc.text(wrapped[i], MARGIN_X + 14, y);
        y += 12;
      }
    }
  }

  // ── Skills ─────────────────────────────────────────────────────────────────
  if (input.skills.length) {
    writeSectionHeader("Skills");
    const skillStr = input.skills.map((s) => s.skill).join(" · ");
    writeParagraph(skillStr, { size: 10, lineGap: 3 });
  }

  // ── Honors & Awards ────────────────────────────────────────────────────────
  if (awards.length) {
    writeSectionHeader("Honors & Awards");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(34, 34, 34);
    for (const a of awards) {
      const issuer = a.issuer ? ` — ${a.issuer}` : "";
      const dateStr = a.issued_date ? `, ${formatRange(a.issued_date, null, false)}` : "";
      const text = `${a.name}${issuer}${dateStr}`;
      const wrapped = doc.splitTextToSize(text, CONTENT_W - 14) as string[];
      ensureSpace(wrapped.length * 12);
      doc.text("•", MARGIN_X + 2, y);
      doc.text(wrapped[0], MARGIN_X + 14, y);
      y += 12;
      for (let i = 1; i < wrapped.length; i++) {
        ensureSpace(12);
        doc.text(wrapped[i], MARGIN_X + 14, y);
        y += 12;
      }
    }
  }

  // Footer on the final page
  addFooter(doc, input.fullName, input.profile.contact_email);

  return doc.output("blob");
}

/** Small footer with name + contact, mirroring the reference layout. */
function addFooter(doc: jsPDF, name: string, email: string | null) {
  const prevSize = doc.getFontSize();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  const parts = [name, email].filter(Boolean) as string[];
  const text = parts.join(" | ");
  doc.text(text, MARGIN_X, PAGE_H - 28);
  doc.setFontSize(prevSize);
}
