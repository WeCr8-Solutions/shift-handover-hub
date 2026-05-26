/**
 * BrandFlyer — single web-native renderer for all 5 print flyer variants.
 *
 * Consolidates the 5 React Native flyer components from
 *   src/brand-system/_source/src/components/flyer/
 * into one data-driven React DOM component using brand-print color tokens.
 *
 * Aspect ratio is locked to 8.5" x 11" (portrait flyer). The wrapper
 * scales via the `width` prop so previews fit any admin layout.
 */

import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  BrandPrintColors as C,
  BrandFonts,
  PrintDimensions,
} from "../brandPrintTokens";
import { JobLineLogo } from "../JobLineLogo";
import { FLYER_CONFIGS, type FlyerVariant } from "./flyerConfigs";

interface BrandFlyerProps {
  variant: FlyerVariant;
  /** Render width in CSS px. Height auto-scales to 8.5x11 aspect. */
  width?: number;
  /** Override CTA target URL (UTM-tagged links etc.) */
  ctaUrl?: string;
  /** Hide the QR if a printer wants the layout alone */
  showQR?: boolean;
  className?: string;
}

export function BrandFlyer({
  variant,
  width = 480,
  ctaUrl,
  showQR = true,
  className,
}: BrandFlyerProps) {
  const cfg = FLYER_CONFIGS[variant];
  const aspect = PrintDimensions.portraitFlyer.height / PrintDimensions.portraitFlyer.width;
  const height = Math.round(width * aspect);

  // Scale factor relative to the original 816px-wide print spec
  const k = width / PrintDimensions.portraitFlyer.width;
  const pad = Math.round(32 * k);

  const finalUrl = ctaUrl ?? cfg.url;
  const displayUrl = useMemo(() => finalUrl.replace(/^https?:\/\//, ""), [finalUrl]);

  return (
    <div
      className={className}
      style={{
        width,
        height,
        backgroundColor: C.navyDeep,
        color: C.white,
        fontFamily: BrandFonts.body,
        padding: pad,
        borderRadius: Math.round(8 * k),
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        gap: Math.round(16 * k),
        overflow: "hidden",
      }}
      role="img"
      aria-label={`${cfg.label} flyer preview`}
    >
      {/* Header */}
      <div style={{ marginBottom: Math.round(8 * k) }}>
        <JobLineLogo scale={k * 1.6} />
      </div>

      {/* Title */}
      <h2
        style={{
          fontFamily: BrandFonts.display,
          fontWeight: 800,
          fontSize: Math.round(44 * k),
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: C.white,
          margin: 0,
          whiteSpace: "pre-line",
          textTransform: "uppercase",
        }}
      >
        {cfg.title}
      </h2>

      {/* Tagline */}
      {cfg.tagline && (
        <p
          style={{
            fontFamily: BrandFonts.display,
            fontWeight: 700,
            fontSize: Math.round(22 * k),
            lineHeight: 1.25,
            color: C.teal,
            margin: 0,
            whiteSpace: "pre-line",
          }}
        >
          {cfg.tagline}
        </p>
      )}

      {/* Bullets */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: Math.round(8 * k), flex: 1 }}>
        {cfg.bullets.map((b) => (
          <li
            key={b}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: Math.round(8 * k),
              fontSize: Math.round(16 * k),
              color: C.whiteOff,
            }}
          >
            <span style={{ color: C.green, fontWeight: 800, lineHeight: 1.2 }}>✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {/* Italic */}
      {cfg.italic && (
        <p
          style={{
            fontStyle: "italic",
            color: C.subtext,
            fontSize: Math.round(14 * k),
            margin: 0,
          }}
        >
          {cfg.italic}
        </p>
      )}

      {/* CTA block */}
      <div
        style={{
          backgroundColor: C.navyCard,
          border: `1px solid ${C.teal}`,
          borderRadius: Math.round(8 * k),
          padding: Math.round(14 * k),
          display: "flex",
          alignItems: "center",
          gap: Math.round(14 * k),
        }}
      >
        {showQR && (
          <div
            style={{
              backgroundColor: C.white,
              padding: Math.round(6 * k),
              borderRadius: Math.round(4 * k),
              flexShrink: 0,
              lineHeight: 0,
            }}
          >
            <QRCodeSVG
              value={finalUrl}
              size={Math.round(72 * k)}
              level="M"
              fgColor={C.navyDeep}
              bgColor={C.white}
            />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: BrandFonts.display,
              fontWeight: 800,
              fontSize: Math.round(18 * k),
              color: C.green,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
            }}
          >
            {cfg.ctaPrimary}
          </div>
          <div
            style={{
              fontFamily: BrandFonts.display,
              fontWeight: 600,
              fontSize: Math.round(15 * k),
              color: C.teal,
              wordBreak: "break-all",
            }}
          >
            {displayUrl}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p
        style={{
          fontSize: Math.round(11 * k),
          color: C.subtext,
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          margin: 0,
        }}
      >
        {cfg.footer}
      </p>
    </div>
  );
}
