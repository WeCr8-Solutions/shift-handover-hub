import { useEffect, useRef, useState, useCallback } from "react";
import { Maximize2, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CertificateTemplate, type CertificateVariant } from "./CertificateTemplate";
import type { CertificateRecord } from "@/lib/certificates";
import { cn } from "@/lib/utils";

/**
 * Responsive viewer for the fixed 11x8.5in (landscape) CertificateTemplate.
 * - Inline mode: scales the certificate to fit the available width (no horizontal overflow on mobile).
 * - Fullscreen modal: pinch-zoom + pan friendly, with +/- controls, for inspecting detail on phones.
 *   On portrait phones we auto-rotate the canvas 90° so the landscape cert fills the viewport.
 */
interface CertificateViewerProps {
  cert: CertificateRecord;
  variant: CertificateVariant;
  /** id applied to the inline (unscaled) certificate node — used by PDF download. */
  printTargetId?: string;
}

const CERT_WIDTH_IN = 11;
const CERT_HEIGHT_IN = 8.5;
const PX_PER_IN = 96; // CSS reference DPI
const CERT_PX_W = CERT_WIDTH_IN * PX_PER_IN; // 1056
const CERT_PX_H = CERT_HEIGHT_IN * PX_PER_IN; // 816

function ScaledCert({
  cert,
  variant,
  scale,
  innerId,
}: {
  cert: CertificateRecord;
  variant: CertificateVariant;
  scale: number;
  innerId?: string;
}) {
  return (
    <div
      style={{
        width: CERT_PX_W * scale,
        height: CERT_PX_H * scale,
      }}
      className="relative"
    >
      <div
        id={innerId}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: CERT_PX_W,
          height: CERT_PX_H,
        }}
      >
        <CertificateTemplate cert={cert} variant={variant} />
      </div>
    </div>
  );
}

export function CertificateViewer({ cert, variant, printTargetId }: CertificateViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [open, setOpen] = useState(false);
  const [modalScale, setModalScale] = useState(1);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    // Fit width; never upscale beyond 1.
    const next = Math.min(1, w / CERT_PX_W);
    setScale(next);
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // Initialize modal scale to fit viewport when opened.
  // On portrait phones, rotate the cert 90° so its landscape orientation fills the screen.
  const [rotate, setRotate] = useState(false);
  useEffect(() => {
    if (!open) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const portrait = vh > vw;
    const shouldRotate = portrait && vw < 700;
    setRotate(shouldRotate);
    const availW = vw - 32;
    const availH = vh - 96;
    const fit = shouldRotate
      ? Math.min(availW / CERT_PX_H, availH / CERT_PX_W)
      : Math.min(availW / CERT_PX_W, availH / CERT_PX_H);
    setModalScale(Math.max(0.3, Math.min(2.5, fit)));
  }, [open]);

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full flex justify-center">
        <ScaledCert cert={cert} variant={variant} scale={scale} innerId={printTargetId} />
      </div>

      <div className="mt-3 flex justify-center print:hidden">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Maximize2 className="w-3.5 h-3.5 mr-1.5" />
          View fullscreen
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "max-w-none w-screen h-[100dvh] sm:h-screen p-0 gap-0 rounded-none border-0 bg-background",
            "translate-x-0 translate-y-0 left-0 top-0",
          )}
        >
          <DialogTitle className="sr-only">Certificate {cert.certId}</DialogTitle>

          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md border bg-background/90 backdrop-blur p-1 shadow">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setModalScale((s) => Math.max(0.3, s - 0.15))}
              aria-label="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-xs tabular-nums w-10 text-center">
              {Math.round(modalScale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setModalScale((s) => Math.min(3, s + 0.15))}
              aria-label="Zoom in"
            >
              <Plus className="w-4 h-4" />
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

          <div
            className="w-full h-full overflow-auto overscroll-contain bg-muted/30"
            style={{ touchAction: "pinch-zoom pan-x pan-y" }}
          >
            <div className="min-w-full min-h-full flex items-start justify-center p-4">
              <ScaledCert cert={cert} variant={variant} scale={modalScale} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
