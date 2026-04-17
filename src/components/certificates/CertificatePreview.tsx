import { CertificateTemplate } from "./CertificateTemplate";
import type { CertificateRecord, CertificateProgram } from "@/lib/certificates";

interface CertificatePreviewProps {
  program: CertificateProgram;
  recipientName?: string;
  programName?: string;
  organizationName?: string | null;
  /** Visual scale (1 = full 8.5x11). Default 0.42 fits nicely in marketing sections. */
  scale?: number;
  className?: string;
}

/**
 * Marketing-friendly, non-interactive certificate preview. Wraps the canonical
 * <CertificateTemplate> at a smaller scale so it fits comfortably in landing
 * page sections without losing fidelity.
 */
export function CertificatePreview({
  program,
  recipientName = "Jane Operator",
  programName,
  organizationName = "Precision Parts Inc.",
  scale = 0.42,
  className = "",
}: CertificatePreviewProps) {
  const sample: CertificateRecord = {
    certId: program === "OAP" ? "OAP-7K3M9X-2026" : "GCA-4J8N2P-2026",
    qrToken: "preview",
    program,
    programName:
      programName ??
      (program === "OAP"
        ? "CNC Operator — Floor Certified"
        : "G-Code Academy — Lathe & Mill Fundamentals"),
    recipientName,
    recipientEmail: "preview@jobline.ai",
    organizationName,
    status: "active",
    validFrom: new Date().toISOString(),
    validUntil: null,
    issuedAt: new Date().toISOString(),
    pdfUrl: null,
    items:
      program === "OAP"
        ? [
            { type: "course", label: "Safety & EHS" },
            { type: "course", label: "Measurement & Inspection" },
            { type: "machine", label: "Haas VF-2 (3-axis Mill)" },
            { type: "machine", label: "Mazak QT-200 (Lathe)" },
            { type: "inspection_tool", label: "Mitutoyo Caliper 0-6\"" },
            { type: "safety_credential", label: "OSHA 10 — General Industry" },
          ]
        : [
            { type: "course", label: "Lathe Fundamentals" },
            { type: "course", label: "Mill Fundamentals" },
            { type: "course", label: "Fanuc Controller Basics" },
            { type: "course", label: "GD&T Symbol Recognition" },
          ],
  };

  // 8.5in x 11in at 96dpi ≈ 816 x 1056 px
  const w = 816 * scale;
  const h = 1056 * scale;

  return (
    <div
      className={`relative mx-auto ${className}`}
      style={{ width: w, height: h }}
      aria-label={`Sample ${program} certificate preview`}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: 816,
          height: 1056,
        }}
      >
        <CertificateTemplate cert={sample} />
      </div>
    </div>
  );
}
