import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, ExternalLink, FileText, Link2, Maximize2, ShieldCheck, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
 * Landscape (11x8.5) thumbnail card for any certificate.
 *
 * Behavior:
 * - JobLine-issued certs (have `linked_cert_id`) → navigate to `/verify/:certId`
 *   which uses the public verification RPC and renders the full certificate
 *   (items, signer, QR). A `?back=` param lets the verify page show a
 *   "Back to profile" button so users aren't stranded.
 * - Self-uploaded files / external credential URLs → open the inline
 *   fullscreen viewer (PDF/image/iframe).
 */
export function CertificateThumbnail({ cert, category }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const deepLinkKey = cert.linked_cert_id ?? cert.id;
  const verifyRoute = cert.linked_cert_id ? `/verify/${cert.linked_cert_id}` : null;
  const externalCredentialUrl =
    !cert.linked_cert_id && cert.credential_url ? cert.credential_url : null;
  const fileUrl = cert.attachment_url ?? null;
  const isPdf = !!fileUrl && /\.pdf($|\?)/i.test(fileUrl);
  const isImg = !!fileUrl && /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(fileUrl);

  // Backward-compatible deep-link: ?cert=<id> on the talent profile redirects
  // to the verify page so previously-shared URLs still work.
  useEffect(() => {
    if (typeof window === "undefined" || !verifyRoute) return;
    const param = new URLSearchParams(window.location.search).get("cert");
    if (param && param === deepLinkKey) {
      const back = window.location.pathname;
      navigate(`${verifyRoute}?back=${encodeURIComponent(back)}`, { replace: true });
    }
  }, [deepLinkKey, verifyRoute, navigate]);

  // What can the operator open from this card?
  // - JobLine-issued (linked_cert_id) -> /verify/:certId page (with full digital cert)
  // - Self-uploaded with a file or external credential link -> inline fullscreen viewer
  // - Self-uploaded with NOTHING attached -> not interactive (nothing to show)
  const hasViewableContent = Boolean(verifyRoute || fileUrl || externalCredentialUrl);

  const handleClick = () => {
    if (verifyRoute) {
      const back = typeof window !== "undefined" ? window.location.pathname : "/";
      navigate(`${verifyRoute}?back=${encodeURIComponent(back)}`);
      return;
    }
    if (fileUrl || externalCredentialUrl) {
      setOpen(true);
    }
  };

  const copyDeepLink = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = verifyRoute
      ? `${window.location.origin}${verifyRoute}`
      : (() => {
          const u = new URL(window.location.href);
          u.searchParams.set("cert", deepLinkKey);
          return u.toString();
        })();
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Certificate link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  }, [deepLinkKey, verifyRoute]);

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

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "group relative w-full text-left rounded-lg border bg-card overflow-hidden ring-1",
          palette.ring,
          "hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label={`View ${cert.name} certificate`}
      >
        <div
          className={cn("relative w-full bg-gradient-to-br", palette.bg)}
          style={{ aspectRatio: "11 / 8.5" }}
        >
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

      {/* Inline viewer is only used for self-uploaded files / external links —
          JobLine-issued certs route to /verify/:certId instead. */}
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
              {externalCredentialUrl && (
                <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                  <a href={externalCredentialUrl} target="_blank" rel="noopener noreferrer">
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
                size="sm"
                className="h-8 px-2"
                onClick={copyDeepLink}
                aria-label="Copy link to this certificate"
              >
                <Link2 className="w-3.5 h-3.5 mr-1" /> Link
              </Button>
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
            {fileUrl ? (
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
            ) : externalCredentialUrl ? (
              <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground p-6 text-center gap-3">
                <p>External credential link.</p>
                <Button asChild size="sm">
                  <a href={externalCredentialUrl} target="_blank" rel="noopener noreferrer">
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
