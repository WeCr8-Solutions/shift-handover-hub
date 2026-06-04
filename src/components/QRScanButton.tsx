/**
 * QRScanButton — uses the browser BarcodeDetector API (with a getUserMedia
 * preview) to scan a work order traveler QR code and navigate to that WO in
 * the queue. Falls back to a polite "not supported" message on browsers
 * without BarcodeDetector (notably Firefox + most desktop Safari).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ScanLine, Camera, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Minimal type so TS is happy without DOM lib bumping.
type BarcodeDetectorLike = {
  detect(source: CanvasImageSource): Promise<{ rawValue: string; format: string }[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: { new (opts?: { formats?: string[] }): BarcodeDetectorLike };
  }
}

interface Props {
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default";
  /** Route to send the user to with the scanned value as `?wo=`. */
  targetPath?: string;
}

export function QRScanButton({ variant = "outline", size = "sm", targetPath = "/queue" }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const supported = typeof window !== "undefined" && !!window.BarcodeDetector;

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleHit = useCallback(
    (raw: string) => {
      stop();
      setOpen(false);
      // Accept either a full URL (from TravelerSheet QR) or a bare work-order id.
      let wo: string | null = null;
      try {
        const u = new URL(raw);
        wo = u.searchParams.get("wo");
        if (!wo) {
          const m = u.pathname.match(/\/work-orders\/([^/]+)/);
          if (m) wo = m[1];
        }
      } catch {
        wo = raw.trim();
      }
      if (!wo) {
        toast({ title: "Unrecognized QR", description: raw.slice(0, 80), variant: "destructive" });
        return;
      }
      navigate(`${targetPath}?wo=${encodeURIComponent(wo)}`);
    },
    [navigate, stop, targetPath, toast],
  );

  useEffect(() => {
    if (!open || !supported) return;
    let cancelled = false;
    setError(null);
    setStarting(true);

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        const detector = new window.BarcodeDetector!({ formats: ["qr_code"] });
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0 && codes[0].rawValue) {
              handleHit(codes[0].rawValue);
              return;
            }
          } catch {
            // Transient detect errors are non-fatal — keep scanning.
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        setStarting(false);
      } catch (e: any) {
        setError(e?.message ?? "Camera unavailable");
        setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [open, supported, handleHit, stop]);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className="gap-2"
        onClick={() => setOpen(true)}
        data-testid="qr-scan-open"
      >
        <ScanLine className="h-4 w-4" /> Scan QR
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) stop(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" /> Scan Traveler QR
            </DialogTitle>
            <DialogDescription>
              Point your camera at the QR code on a printed traveler to jump straight to that work order.
            </DialogDescription>
          </DialogHeader>

          {!supported ? (
            <div className="rounded-md border border-status-warning/40 bg-status-warning/10 p-3 text-sm">
              <AlertTriangle className="inline h-4 w-4 mr-1 text-status-warning" />
              Your browser doesn&rsquo;t support the BarcodeDetector API. Try Chrome or Edge on a mobile
              device, or type the work-order number into the queue search instead.
            </div>
          ) : error ? (
            <div className="rounded-md border border-status-error/40 bg-status-error/10 p-3 text-sm text-status-error">
              {error}
            </div>
          ) : (
            <div className="relative aspect-square w-full overflow-hidden rounded-md bg-black">
              <video
                ref={videoRef}
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
                data-testid="qr-scan-video"
              />
              <div className="pointer-events-none absolute inset-6 border-2 border-white/80 rounded-md" />
              {starting && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <Loader2 className="h-5 w-5 animate-spin" /> &nbsp; Starting camera…
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); stop(); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
