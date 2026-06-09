import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

/**
 * Wet-style signature capture pad.
 * Works on mouse (Windows desktop), touch (tablets/phones), and stylus/pen.
 * Renders the captured signature inline so it prints with the document.
 * Falls back to a printed blank line (caption) when no signature is drawn,
 * so the same component supports both digital and pen-and-paper workflows.
 */
export interface SignaturePadProps {
  caption: string;
  height?: number;
  storageKey?: string; // persist between sessions on the same device
  printedName?: string;
  showPrintedNameBelow?: boolean;
}

export function SignaturePad({
  caption,
  height = 56,
  storageKey,
  printedName,
  showPrintedNameBelow,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    // Preserve existing drawing across resize
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

  // Restore saved signature
  useEffect(() => {
    if (!storageKey) return;
    try {
      const dataUrl = localStorage.getItem(storageKey);
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasInk(true);
      };
      img.src = dataUrl;
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const persist = useCallback(() => {
    if (!storageKey) return;
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      localStorage.setItem(storageKey, canvas.toDataURL("image/png"));
    } catch {}
  }, [storageKey]);

  const pointFromEvent = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = pointFromEvent(e);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
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
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    try { canvasRef.current?.releasePointerCapture(e.pointerId); } catch {}
    persist();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasInk(false);
    if (storageKey) try { localStorage.removeItem(storageKey); } catch {}
  };

  return (
    <div>
      <div className="relative" style={{ height }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full border-b border-black bg-transparent touch-none"
          style={{ touchAction: "none" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
        />
        {!hasInk && (
          <div className="no-print pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-black/30 select-none">
            sign here (mouse, finger, or pen) — or leave blank to wet-sign on paper
          </div>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={clear}
          className="no-print absolute right-1 top-1 h-6 px-2 text-[10px] gap-1 text-black/60 hover:text-black"
        >
          <Eraser className="w-3 h-3" /> Clear
        </Button>
      </div>
      <div className="mt-1 text-[10px] leading-tight">
        {caption}
        {showPrintedNameBelow && printedName ? (
          <div className="text-black/80 italic">{printedName}</div>
        ) : null}
      </div>
    </div>
  );
}
