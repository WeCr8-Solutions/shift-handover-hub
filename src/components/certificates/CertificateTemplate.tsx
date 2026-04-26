import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { type CertificateRecord, type CertificateProgram } from "@/lib/certificates";

export type CertificateVariant = "diploma" | "digital";

interface CertificateTemplateProps {
  cert: CertificateRecord;
  /** "diploma" = formal college-degree style for print/PDF.
   *  "digital" = compact in-app view focused on the program's accomplishments. */
  variant?: CertificateVariant;
  /** When true, applies print-friendly styling (no shadow, exact colors). */
  printMode?: boolean;
}

/**
 * Branded JobLine.ai certificate — single source of truth for OAP & GCA.
 * The `variant` controls layout:
 *   - "diploma" (printable): serif typography, ornate border, formal signature block,
 *     QR points to the operator's PUBLIC TALENT PROFILE (not the verify URL),
 *     verification ID printed as small footer text.
 *   - "digital" (in-app): clean shop-floor card listing this program's accomplishments,
 *     same signature + QR-to-profile.
 */
export function CertificateTemplate({
  cert,
  variant = "digital",
  printMode = false,
}: CertificateTemplateProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // QR always points to the operator's public talent profile.
  // Falls back to the verify URL only if no public username is available.
  const profileUrl = cert.recipientUsername
    ? `https://jobline.ai/talent/${cert.recipientUsername}`
    : `https://jobline.ai/verify/${cert.certId}`;

  useEffect(() => {
    QRCode.toDataURL(profileUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 320,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [profileUrl]);

  const programLabel: Record<CertificateProgram, string> = {
    OAP: "Operator Acceptance Program",
    GCA: "G-Code Academy",
  };

  return variant === "diploma" ? (
    <DiplomaCertificate cert={cert} qrDataUrl={qrDataUrl} programLabel={programLabel} printMode={printMode} />
  ) : (
    <DigitalCertificate cert={cert} qrDataUrl={qrDataUrl} programLabel={programLabel} printMode={printMode} />
  );
}

/* ------------------------------------------------------------------ */
/* DIPLOMA — formal, college-degree style for print / PDF              */
/* ------------------------------------------------------------------ */

interface InnerProps {
  cert: CertificateRecord;
  qrDataUrl: string;
  programLabel: Record<CertificateProgram, string>;
  printMode: boolean;
}

function DiplomaCertificate({ cert, qrDataUrl, programLabel, printMode }: InnerProps) {
  return (
    <div
      className={`relative bg-card text-card-foreground ${printMode ? "" : "shadow-2xl"}`}
      style={{
        width: "11in",
        minHeight: "8.5in",
        aspectRatio: "11 / 8.5",
        padding: "0.5in",
        fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
        background:
          "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)",
      }}
    >
      {/* Ornate double border */}
      <div className="absolute inset-[0.3in] border-2 border-primary/70 pointer-events-none" />
      <div className="absolute inset-[0.38in] border border-primary/30 pointer-events-none" />

      {/* Corner flourishes */}
      {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((pos) => (
        <CornerFlourish key={pos} position={pos} />
      ))}

      <div className="relative h-full flex flex-col items-center text-center" style={{ padding: "0.3in 0.4in" }}>
        {/* JobLine.ai seal / wordmark */}
        <div className="flex flex-col items-center mb-4">
          <div
            className="w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center bg-primary/5"
            aria-hidden
          >
            <span className="text-2xl font-black text-primary tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>
              JL
            </span>
          </div>
          <div
            className="mt-2 text-[10px] uppercase tracking-[0.35em] text-muted-foreground font-bold"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            JobLine.ai · Operator Acceptance
          </div>
        </div>

        {/* Title */}
        <div className="text-[42px] leading-tight font-bold text-foreground italic">Certificate</div>
        <div className="text-sm tracking-[0.4em] uppercase text-muted-foreground mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
          of Completion
        </div>

        {/* Body */}
        <div className="mt-6 text-sm text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
          This certifies that
        </div>

        <div
          className="mt-3 text-5xl font-bold text-foreground"
          style={{ fontFamily: "'Great Vibes', 'Playfair Display', cursive" }}
        >
          {cert.recipientName}
        </div>
        <div className="w-3/4 border-b border-border mt-2" />

        <div className="mt-5 max-w-[6in] text-sm leading-relaxed text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
          has successfully demonstrated proficiency in and is hereby recognized for completion of the
        </div>
        <div className="mt-3 text-2xl font-bold text-foreground italic">{cert.programName}</div>
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
          {programLabel[cert.program]}
        </div>

        {cert.organizationName && (
          <div className="mt-2 text-sm text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
            issued in collaboration with <strong className="text-foreground">{cert.organizationName}</strong>
          </div>
        )}

        {/* Spacer pushes signature block to bottom */}
        <div className="flex-1" />

        {/* Signature + Date + QR row */}
        <div className="w-full grid grid-cols-3 gap-6 items-end mt-6" style={{ fontFamily: "Inter, sans-serif" }}>
          {/* Signature — left */}
          <div className="flex flex-col items-center">
            <div className="h-12 flex items-end justify-center">
              {cert.signedBySignatureUrl ? (
                <img src={cert.signedBySignatureUrl} alt="Signature" className="max-h-12" />
              ) : (
                <div
                  className="text-2xl text-foreground"
                  style={{ fontFamily: "'Great Vibes', cursive" }}
                >
                  {cert.signedByName ?? "—"}
                </div>
              )}
            </div>
            <div className="w-full border-t border-foreground/60 pt-1">
              <div className="text-xs font-semibold text-foreground">{cert.signedByName ?? "Designated Mentor"}</div>
              <div className="text-[9px] text-muted-foreground leading-tight">
                {cert.signedByTitle ?? "Designated OAP Mentor"}
              </div>
            </div>
          </div>

          {/* Date — center */}
          <div className="flex flex-col items-center">
            <div className="h-12 flex items-end justify-center">
              <div className="text-base font-semibold text-foreground">
                {new Date(cert.issuedAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
            <div className="w-full border-t border-foreground/60 pt-1 text-center">
              <div className="text-xs font-semibold text-foreground">Date of Issue</div>
              {cert.validUntil && (
                <div className="text-[9px] text-muted-foreground">
                  Valid through {new Date(cert.validUntil).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* QR — right (links to operator's public profile) */}
          <div className="flex flex-col items-center">
            <div className="h-20 flex items-end justify-center">
              {qrDataUrl && <img src={qrDataUrl} alt="Operator profile QR" className="w-20 h-20" />}
            </div>
            <div className="w-full border-t border-foreground/60 pt-1 text-center">
              <div className="text-xs font-semibold text-foreground">Public Profile</div>
              {cert.recipientUsername && (
                <div className="text-[9px] text-muted-foreground font-mono">@{cert.recipientUsername}</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer micro-text */}
        <div
          className="mt-3 text-[8px] text-muted-foreground tracking-wide"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Verify authenticity at jobline.ai/verify/<span className="font-mono">{cert.certId}</span>
        </div>
      </div>
    </div>
  );
}

function CornerFlourish({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const [v, h] = position.split("-") as ["top" | "bottom", "left" | "right"];
  return (
    <div
      className="absolute w-12 h-12 pointer-events-none"
      style={{
        [v]: "0.4in",
        [h]: "0.4in",
        borderTop: v === "top" ? "3px solid hsl(var(--primary))" : undefined,
        borderBottom: v === "bottom" ? "3px solid hsl(var(--primary))" : undefined,
        borderLeft: h === "left" ? "3px solid hsl(var(--primary))" : undefined,
        borderRight: h === "right" ? "3px solid hsl(var(--primary))" : undefined,
      } as React.CSSProperties}
    />
  );
}

/* ------------------------------------------------------------------ */
/* DIGITAL — accomplishments-focused in-app card                       */
/* ------------------------------------------------------------------ */

function DigitalCertificate({ cert, qrDataUrl, programLabel, printMode }: InnerProps) {
  const accentClass = cert.program === "OAP" ? "from-primary to-accent" : "from-accent to-primary";

  return (
    <div
      className={`relative bg-card text-card-foreground border-2 border-border ${
        printMode ? "" : "shadow-2xl rounded-xl"
      }`}
      style={{
        width: "11in",
        minHeight: "8.5in",
        aspectRatio: "11 / 8.5",
        padding: "0.55in",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${accentClass}`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6 pt-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            JobLine.ai · {programLabel[cert.program]}
          </div>
          <div className="mt-1 text-3xl font-black tracking-tight">Certificate of Completion</div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${accentClass} text-primary-foreground`}
        >
          {cert.program}
        </div>
      </div>

      {/* Recipient */}
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Awarded to</div>
        <div className="text-4xl font-bold border-b-2 border-border pb-2">{cert.recipientName}</div>
        {cert.recipientUsername && (
          <div className="text-xs text-muted-foreground mt-1 font-mono">@{cert.recipientUsername}</div>
        )}
      </div>

      {/* Program */}
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Program</div>
        <div className="text-2xl font-bold mb-1">{cert.programName}</div>
        {cert.organizationName && (
          <div className="text-sm text-muted-foreground">
            issued by <strong className="text-foreground">{cert.organizationName}</strong>
          </div>
        )}
      </div>

      {/* Accomplishments — items completed for THIS program */}
      {cert.items && cert.items.length > 0 && (
        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
            Accomplishments in this program
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            {cert.items.map((it, i) => (
              <div key={i} className="flex items-baseline gap-2">
                <span className="text-primary">✓</span>
                <span>
                  <span className="text-muted-foreground">[{it.type.replace("_", " ")}]</span> {it.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer block */}
      <div className="absolute bottom-[0.6in] left-[0.6in] right-[0.6in]">
        <div className="grid grid-cols-3 gap-4 items-end pt-4 border-t border-border">
          {/* Signature */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Mentor / Approver</div>
            <div
              className="text-lg text-foreground"
              style={{ fontFamily: "'Great Vibes', cursive" }}
            >
              {cert.signedByName ?? "—"}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              {cert.signedByTitle ?? "Designated OAP Mentor"}
            </div>
          </div>

          {/* Issued / Cert ID */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Issued</div>
            <div className="text-sm font-semibold">
              {new Date(cert.issuedAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{cert.certId}</div>
          </div>

          {/* QR → public talent profile */}
          <div className="flex justify-end">
            {qrDataUrl && (
              <div className="text-center">
                <img src={qrDataUrl} alt="Operator profile QR" className="w-20 h-20" />
                <div className="text-[8px] text-muted-foreground mt-0.5">
                  {cert.recipientUsername ? `jobline.ai/talent/${cert.recipientUsername}` : "jobline.ai/verify"}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-center text-[10px] text-muted-foreground mt-3">
          Verify authenticity at <span className="font-mono">jobline.ai/verify/{cert.certId}</span>
        </div>
      </div>
    </div>
  );
}
