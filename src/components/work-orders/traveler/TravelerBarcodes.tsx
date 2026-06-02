/**
 * TravelerBarcodes — client-side Code128 + QR rendering for the printable
 * Work Order Traveler. Uses bwip-js for the linear barcode and the existing
 * `qrcode` dependency for the QR.
 */
import { useEffect, useRef } from "react";
import bwipjs from "bwip-js";
import QRCode from "qrcode";

interface BarcodeProps {
  value: string;
  label?: string;
  height?: number;
  scale?: number;
}

export function Code128({ value, label, height = 12, scale = 2 }: BarcodeProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      bwipjs.toCanvas(ref.current, {
        bcid: "code128",
        text: value,
        scale,
        height,
        includetext: false,
        backgroundcolor: "FFFFFF",
      });
    } catch {
      /* invalid input — leave canvas blank */
    }
  }, [value, height, scale]);
  return (
    <div className="flex flex-col items-center gap-1">
      <canvas ref={ref} className="max-w-full" />
      <div className="font-mono text-[10px] tracking-widest">{label ?? value}</div>
    </div>
  );
}

interface QRProps {
  value: string;
  size?: number;
  label?: string;
}

export function QR({ value, size = 110, label }: QRProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    QRCode.toCanvas(ref.current, value, { width: size, margin: 0, errorCorrectionLevel: "M" }).catch(() => undefined);
  }, [value, size]);
  return (
    <div className="flex flex-col items-center gap-1">
      <canvas ref={ref} width={size} height={size} />
      {label && <div className="font-mono text-[9px]">{label}</div>}
    </div>
  );
}
