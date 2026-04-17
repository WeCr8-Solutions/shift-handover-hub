import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { qrPayload, type CertificateRecord, type CertificateProgram } from "@/lib/certificates";

interface CertificateTemplateProps {
  cert: CertificateRecord;
  /** When true, applies print-friendly styling (no shadow, exact colors). */
  printMode?: boolean;
}

/**
 * Branded JobLine certificate template — single source of truth for both
 * OAP and GCA. Renders an 8.5" x 11" portrait card. Use the same component
 * for in-app preview, print, and (via html-to-pdf) PDF generation.
 */
export function CertificateTemplate({ cert, printMode = false }: CertificateTemplateProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(qrPayload(cert.certId, cert.qrToken), {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 280,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    }).then(setQrDataUrl).catch(() => {});
  }, [cert.certId, cert.qrToken]);

  const programLabel: Record<CertificateProgram, string> = {
    OAP: "Operator Acceptance Program",
    GCA: "G-Code Academy",
  };
  const accentClass = cert.program === "OAP" ? "from-primary to-accent" : "from-accent to-primary";

  return (
    <div
      className={`relative bg-card text-card-foreground border-2 border-border ${
        printMode ? "" : "shadow-2xl rounded-xl"
      }`}
      style={{
        width: "8.5in",
        minHeight: "11in",
        aspectRatio: "8.5 / 11",
        padding: "0.6in",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${accentClass}`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6 pt-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            JobLine.ai · {programLabel[cert.program]}
          </div>
          <div className="mt-1 text-3xl font-black tracking-tight">
            Certificate of Completion
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${accentClass} text-primary-foreground`}>
          {cert.program}
        </div>
      </div>

      {/* Awarded to */}
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
          This is to certify that
        </div>
        <div className="text-4xl font-bold border-b-2 border-border pb-2">
          {cert.recipientName}
        </div>
      </div>

      {/* Body */}
      <div className="mb-6 text-sm leading-relaxed">
        has successfully completed the requirements for
      </div>
      <div className="mb-6">
        <div className="text-2xl font-bold mb-1">{cert.programName}</div>
        {cert.organizationName && (
          <div className="text-sm text-muted-foreground">
            issued in collaboration with <strong>{cert.organizationName}</strong>
          </div>
        )}
      </div>

      {/* Items */}
      {cert.items && cert.items.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          {cert.items.map((it, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="text-muted-foreground">·</span>
              <span>
                <span className="text-muted-foreground">[{it.type.replace("_", " ")}]</span>{" "}
                {it.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer block */}
      <div className="absolute bottom-[0.6in] left-[0.6in] right-[0.6in]">
        <div className="grid grid-cols-3 gap-4 items-end pt-4 border-t border-border">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Certificate ID
            </div>
            <div className="font-mono text-sm font-semibold">{cert.certId}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Issued
            </div>
            <div className="text-sm font-semibold">
              {new Date(cert.issuedAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            {cert.validUntil && (
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Expires {new Date(cert.validUntil).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            {qrDataUrl && (
              <div className="text-center">
                <img src={qrDataUrl} alt="Verify" className="w-20 h-20" />
                <div className="text-[8px] text-muted-foreground mt-0.5">
                  jobline.ai/verify
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-center text-[10px] text-muted-foreground mt-3">
          Verify the authenticity of this certificate at{" "}
          <span className="font-mono">jobline.ai/verify/{cert.certId}</span>
        </div>
      </div>
    </div>
  );
}
