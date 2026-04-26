import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Award, ExternalLink, FileText, Loader2, Maximize2, ShieldCheck, Trophy, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCertificates } from "@/hooks/useCertificates";
import { CertificateTemplate } from "./CertificateTemplate";
import type { CertificateRecord } from "@/lib/certificates";

export type CertCategory = "oap" | "gca" | "partner" | "self";

export interface ThumbnailCert {
  id: string;
  name: string;
  issuer?: string | null;
  issued_date?: string | null;
  expires_date?: string | null;
  attachment_url?: string | null;
  credential_url?: string | null;
  credential_id?: string | null;
  linked_cert_id?: string | null;
  verification_source?: string | null;
}

interface Props {
  cert: ThumbnailCert;
  category: CertCategory;
}

/**
 * Landscape (11x8.5) thumbnail card for any certificate. Tap to open a
 * fullscreen viewer that fits the user's device. For uploaded files (PDF/IMG)
 * we render the file in an inline iframe/img with pinch-zoom; for verified
 * JobLine certs we link to the public verify page.
 */
export function CertificateThumbnail({ cert, category }: Props) {
  const [open, setOpen] = useState(false);
  const { lookupCertificate } = useCertificates();
  const [fullCert, setFullCert] = useState<CertificateRecord | null>(null);
  const [loadingCert, setLoadingCert] = useState(false);

  // When opened on a JobLine-issued cert (linked_cert_id), fetch the full
  // record so we can render the digital certificate inline — avoids iframe
  // redirects from auth gates that previously bounced users to /operator/profile.
  useEffect(() => {
    if (!open || !cert.linked_cert_id || fullCert) return;
    setLoadingCert(true);
    lookupCertificate(cert.linked_cert_id)
      .then((c) => setFullCert(c))
      .finally(() => setLoadingCert(false));
  }, [open, cert.linked_cert_id, fullCert, lookupCertificate]);

  const palette = (() => {
    switch (category) {
      case "oap":
        return { ring: "ring-primary/40", bg: "from-primary/15 to-primary/5", text: "text-primary", icon: ShieldCheck, label: "JobLine OAP" };
      case "gca":
        return { ring: "ring-warning/40", bg: "from-warning/15 to-warning/5", text: "text-warning", icon: Trophy, label: "G-Code Academy" };
      case "partner":
        return { ring: "ring-accent/40", bg: "from-accent/15 to-accent/5", text: "text-accent-foreground", icon: ShieldCheck, label: cert.issuer ?? "Partner Verified" };
      default:
        return { ring: "ring-border", bg: "from-muted to-background", text: "text-foreground", icon: Award, label: cert.issuer ?? "Self-uploaded" };
    }
  })();
  const Icon = palette.icon;

  const verifyUrl =
    cert.linked_cert_id ? `/verify/${cert.linked_cert_id}` : cert.credential_url ?? null;
  const fileUrl = cert.attachment_url ?? null;
  const isPdf = !!fileUrl && /\.pdf($|\?)/i.test(fileUrl);
  const isImg = !!fileUrl && /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(fileUrl);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group relative w-full text-left rounded-lg border bg-card overflow-hidden ring-1",
          palette.ring,
          "hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label={`View ${cert.name} certificate`}
      >
        {/* 11:8.5 aspect landscape thumbnail */}
        <div
          className={cn("relative w-full bg-gradient-to-br", palette.bg)}
          style={{ aspectRatio: "11 / 8.5" }}
        >
          {/* Faux mini-cert layout */}
          <div className="absolute inset-0 p-2.5 sm:p-3 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Icon className={cn("w-3.5 h-3.5 shrink-0", palette.text)} />
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider truncate">
                  {palette.label}
                </span>
              </div>
              <Maximize2 className="w-3 h-3 text-muted-foreground opacity-60" />
            </div>
            <div className="flex-1 flex flex-col justify-center text-center px-1 min-h-0">
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                Certificate
              </p>
              <p className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2 sm:line-clamp-3 mt-0.5 break-words">
                {cert.name}
              </p>
              {cert.issuer && category !== "self" && category !== "partner" && (
                <p className="text-[9px] text-muted-foreground mt-1 truncate">{cert.issuer}</p>
              )}
            </div>
            <div className="flex items-end justify-between gap-2 text-[8px] sm:text-[9px] text-muted-foreground">
              <span className="font-mono truncate">
                {cert.linked_cert_id ?? cert.credential_id ?? ""}
              </span>
              <span className="shrink-0">
                {cert.issued_date ? new Date(cert.issued_date).getFullYear() : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="px-2 py-1 border-t flex items-center justify-between gap-2">
          <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate">Tap to view</span>
          {category !== "self" && (
            <Badge variant="outline" className="h-4 px-1 text-[8px] sm:text-[9px] shrink-0">Verified</Badge>
          )}
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "max-w-none w-screen h-[100dvh] sm:h-screen p-0 gap-0 rounded-none border-0 bg-background",
            "translate-x-0 translate-y-0 left-0 top-0",
          )}
        >
          <DialogTitle className="sr-only">{cert.name}</DialogTitle>

          <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between gap-2">
            <div className="rounded-md bg-background/90 backdrop-blur px-3 py-1.5 border shadow text-xs font-medium truncate max-w-[60%]">
              {cert.name}
            </div>
            <div className="flex items-center gap-1 rounded-md border bg-background/90 backdrop-blur p-1 shadow">
              {verifyUrl && (
                <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                  <a href={verifyUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Verify
                  </a>
                </Button>
              )}
              {fileUrl && (
                <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" download>
                    <FileText className="w-3.5 h-3.5 mr-1" /> Open
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div
            className="w-full h-full overflow-auto overscroll-contain bg-muted/40 pt-14"
            style={{ touchAction: "pinch-zoom pan-x pan-y" }}
          >
            {cert.linked_cert_id ? (
              loadingCert && !fullCert ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading certificate…
                </div>
              ) : fullCert ? (
                <ScaledCertificate cert={fullCert} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground p-6 text-center gap-3">
                  <p>Couldn't load this certificate inline.</p>
                  {verifyUrl && (
                    <Button asChild size="sm">
                      <a href={verifyUrl} target="_blank" rel="noopener noreferrer">
                        Open verification page
                      </a>
                    </Button>
                  )}
                </div>
              )
            ) : fileUrl ? (
              isImg ? (
                <div className="min-w-full min-h-full flex items-center justify-center p-4">
                  <img
                    src={fileUrl}
                    alt={cert.name}
                    className="max-w-full max-h-[calc(100dvh-5rem)] object-contain shadow-xl"
                  />
                </div>
              ) : isPdf ? (
                <iframe
                  src={`${fileUrl}#view=FitH`}
                  title={cert.name}
                  className="w-full h-[calc(100dvh-3.5rem)] border-0 bg-background"
                />
              ) : (
                <iframe
                  src={fileUrl}
                  title={cert.name}
                  className="w-full h-[calc(100dvh-3.5rem)] border-0 bg-background"
                />
              )
            ) : verifyUrl ? (
              <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground p-6 text-center gap-3">
                <p>External credential link.</p>
                <Button asChild size="sm">
                  <a href={verifyUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open verification
                  </a>
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-6 text-center">
                No file or verification link attached to this certificate.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Renders the fixed-width (1056px) CertificateTemplate scaled to fit the
 * available container width while reserving correct layout height — prevents
 * the cert from rendering off-screen on mobile (the previous transform-only
 * approach left a 1056px-wide flex child that pushed the scaled visual out
 * of view).
 */
function ScaledCertificate({ cert }: { cert: CertificateRecord }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    const update = () => {
      const w = wrap.clientWidth;
      const s = Math.min(1, w / 1056);
      setScale(s);
      setInnerHeight(inner.scrollHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [cert]);

  return (
    <div className="w-full p-2 sm:p-6 flex justify-center">
      <div
        ref={wrapRef}
        className="w-full max-w-[1056px] relative"
        style={{ height: innerHeight ?? undefined }}
      >
        <div
          ref={innerRef}
          className="shadow-2xl absolute top-0 left-0"
          style={{
            width: 1056,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <CertificateTemplate cert={cert} variant="digital" />
        </div>
      </div>
    </div>
  );
}
