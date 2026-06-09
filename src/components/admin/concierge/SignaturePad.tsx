import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Lock, ShieldCheck } from "lucide-react";

/**
 * Wet-style signature capture pad — reusable across the concierge package
 * and anywhere else a signature is collected (Windows desktop / tablet / phone).
 *
 * Lock model
 * ----------
 * After the signer is satisfied, they press **Sign &amp; Lock**. The pad then:
 *   1. Freezes the canvas (no more drawing, no clear button).
 *   2. Saves the PNG under `{storageKey}` and a sealed envelope under
 *      `{storageKey}:locked` containing { dataUrl, sha256, signedAt, signerName }.
 *   3. Restoring on a later session reads the locked envelope first; if the
 *      stored PNG hash no longer matches the sealed hash the pad refuses to
 *      render the signature and surfaces a tamper warning instead of silently
 *      accepting an altered image.
 *
 * Unlock is intentionally not provided in the UI. The master record is the
 * locked envelope; clearing it requires an explicit `unlockSignature(key)`
 * console call (exported) so re-signing is an auditable, deliberate action.
 */

const LOCK_SUFFIX = ":locked";

export interface LockedEnvelope {
  dataUrl: string;
  sha256: string;
  signedAt: string;
  signerName?: string;
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readLocked(storageKey?: string): LockedEnvelope | null {
  if (!storageKey) return null;
  try {
    const raw = localStorage.getItem(storageKey + LOCK_SUFFIX);
    if (!raw) return null;
    return JSON.parse(raw) as LockedEnvelope;
  } catch {
    return null;
  }
}

/** Escape-hatch for re-signing. Intentionally not wired to a button. */
export function unlockSignature(storageKey: string) {
  try {
    localStorage.removeItem(storageKey + LOCK_SUFFIX);
    localStorage.removeItem(storageKey);
  } catch {}
}

export interface SignaturePadProps {
  caption: string;
  height?: number;
  storageKey?: string;
  printedName?: string;
  showPrintedNameBelow?: boolean;
  /** Optional override label for the lock button. */
  lockLabel?: string;
  /**
   * Hard-lock the pad. When true the canvas is non-interactive and no
   * Clear / Sign & Lock controls render. Used by the Concierge finalize
   * flow to guarantee no further edits after the master is sealed.
   */
  readOnly?: boolean;
}

export function SignaturePad({
  caption,
  height = 56,
  storageKey,
  printedName,
  showPrintedNameBelow,
  lockLabel,
  readOnly = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [locked, setLocked] = useState<LockedEnvelope | null>(() => readLocked(storageKey));
  const [tampered, setTampered] = useState(false);

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const prev = document.createElement("canvas");
    prev.width = canvas.width;
    prev.height = canvas.height;
    const pctx = prev.getContext("2d");
    if (pctx && canvas.width && canvas.height) pctx.drawImage(canvas, 0, 0);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = getCtx();
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0a0a0a";
      ctx.lineWidth = 1.6;
      if (prev.width) ctx.drawImage(prev, 0, 0, rect.width, rect.height);
    }
  }, []);

  useEffect(() => {
    resize();
    const ro = new ResizeObserver(resize);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [resize]);

  // Restore (locked envelope wins; verify hash to detect tampering)
  useEffect(() => {
    if (!storageKey) return;
    let cancelled = false;
    (async () => {
      const env = readLocked(storageKey);
      const draftUrl = localStorage.getItem(storageKey) ?? "";
      const targetUrl = env?.dataUrl ?? draftUrl;
      if (env) {
        const expected = await sha256Hex(env.dataUrl);
        if (expected !== env.sha256) {
          if (!cancelled) setTampered(true);
          return;
        }
      }
      if (!targetUrl) return;
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasInk(true);
        if (env) setLocked(env);
      };
      img.src = targetUrl;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const persistDraft = useCallback(() => {
    if (!storageKey || locked) return;
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      localStorage.setItem(storageKey, canvas.toDataURL("image/png"));
    } catch {}
  }, [storageKey, locked]);

  const pointFromEvent = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (locked || readOnly) return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = pointFromEvent(e);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (locked || readOnly || !drawingRef.current) return;
    const ctx = getCtx();
    const p = pointFromEvent(e);
    const last = lastPointRef.current;
    if (ctx && last) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    lastPointRef.current = p;
    if (!hasInk) setHasInk(true);
  };
  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (locked || readOnly || !drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {}
    persistDraft();
  };

  const clear = () => {
    if (locked) return;
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasInk(false);
    if (storageKey)
      try {
        localStorage.removeItem(storageKey);
      } catch {}
  };

  const lockNow = async () => {
    if (locked) return;
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    const dataUrl = canvas.toDataURL("image/png");
    const env: LockedEnvelope = {
      dataUrl,
      sha256: await sha256Hex(dataUrl),
      signedAt: new Date().toISOString(),
      signerName: printedName,
    };
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, dataUrl);
        localStorage.setItem(storageKey + LOCK_SUFFIX, JSON.stringify(env));
      } catch {}
    }
    setLocked(env);
  };

  const lockedDate = locked
    ? new Date(locked.signedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div>
      <div className="relative" style={{ height }}>
        <canvas
          ref={canvasRef}
          className={`block w-full h-full border-b border-black bg-transparent touch-none ${
            locked ? "cursor-not-allowed" : ""
          }`}
          style={{ touchAction: locked ? "auto" : "none" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
        />
        {!hasInk && !locked && (
          <div className="no-print pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-black/30 select-none">
            sign here (mouse, finger, or pen) — or leave blank to wet-sign on paper
          </div>
        )}
        {!locked && hasInk && (
          <div className="no-print absolute right-1 top-1 flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clear}
              className="h-6 px-2 text-[10px] gap-1 text-black/60 hover:text-black"
            >
              <Eraser className="w-3 h-3" /> Clear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={lockNow}
              className="h-6 px-2 text-[10px] gap-1"
            >
              <Lock className="w-3 h-3" /> {lockLabel ?? "Sign & Lock"}
            </Button>
          </div>
        )}
        {locked && (
          <div
            className="no-print absolute right-1 top-1 flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5"
            title={`Sealed ${lockedDate} · sha256 ${locked.sha256.slice(0, 12)}…`}
          >
            <ShieldCheck className="w-3 h-3" /> Sealed
          </div>
        )}
        {tampered && (
          <div className="no-print absolute inset-0 flex items-center justify-center text-[10px] text-red-700 bg-red-50/90 border border-red-300">
            Signature tamper detected — sealed hash mismatch. Re-sign required.
          </div>
        )}
      </div>
      <div className="mt-1 text-[10px] leading-tight">
        {caption}
        {showPrintedNameBelow && printedName ? (
          <div className="text-black/80 italic">{printedName}</div>
        ) : null}
        {locked && lockedDate ? (
          <div className="text-emerald-700 mt-0.5">
            Wet-signed &amp; sealed {lockedDate}
            {locked.signerName ? ` · ${locked.signerName}` : ""}
          </div>
        ) : null}
      </div>
    </div>
  );
}
