/**
 * Business Card — web port of
 *   src/brand-system/_source/src/components/card/BusinessCard.tsx.txt
 *
 * Renders front + back side at 3.5"x2" print spec.
 */

import { QRCodeSVG } from "qrcode.react";
import { BrandPrintColors as C, BrandFonts, PrintDimensions } from "./brandPrintTokens";
import { JobLineLogo, LogoMark } from "./JobLineLogo";

interface BusinessCardProps {
  side?: "front" | "back";
  theme?: "dark" | "light";
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  /** Profile URL — also encoded into QR */
  url?: string;
  width?: number;
  className?: string;
}

export function BusinessCard({
  side = "front",
  theme = "dark",
  name = "Your Name",
  title = "Title / Role",
  email = "you@jobline.ai",
  phone = "+1 (555) 000-0000",
  url = "https://jobline.ai/talent",
  width = 360,
  className,
}: BusinessCardProps) {
  const aspect = PrintDimensions.businessCard.height / PrintDimensions.businessCard.width;
  const height = Math.round(width * aspect);
  const k = width / PrintDimensions.businessCard.width;

  const bg = theme === "light" ? C.lightBg : C.navyDeep;
  const surface = theme === "light" ? C.white : C.navyCard;
  const text = theme === "light" ? C.lightText : C.white;
  const subtext = theme === "light" ? C.lightSubtext : C.subtext;
  const accent = theme === "light" ? C.lightAccent : C.teal;

  return (
    <div
      className={className}
      style={{
        width,
        height,
        backgroundColor: bg,
        color: text,
        fontFamily: BrandFonts.body,
        padding: Math.round(16 * k),
        borderRadius: Math.round(6 * k),
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        display: "flex",
        flexDirection: side === "back" ? "row" : "column",
        gap: Math.round(8 * k),
        alignItems: side === "back" ? "center" : "stretch",
        justifyContent: side === "back" ? "space-between" : "space-between",
        overflow: "hidden",
      }}
    >
      {side === "front" ? (
        <>
          <JobLineLogo scale={k * 1.4} variant={theme === "light" ? "dark" : "default"} />
          <div>
            <div
              style={{
                fontFamily: BrandFonts.display,
                fontWeight: 800,
                fontSize: Math.round(18 * k),
                lineHeight: 1.1,
                color: text,
              }}
            >
              {name}
            </div>
            <div style={{ fontSize: Math.round(12 * k), color: subtext, marginTop: Math.round(2 * k) }}>
              {title}
            </div>
          </div>
          <div style={{ fontSize: Math.round(11 * k), color: subtext, display: "flex", flexDirection: "column", gap: Math.round(2 * k) }}>
            <span>{email}</span>
            <span>{phone}</span>
            <span style={{ color: accent, fontWeight: 600 }}>{url.replace(/^https?:\/\//, "")}</span>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: Math.round(8 * k), maxWidth: "60%" }}>
            <LogoMark size={Math.round(28 * k)} variant={theme === "light" ? "default" : "teal"} />
            <div
              style={{
                fontFamily: BrandFonts.display,
                fontWeight: 800,
                fontSize: Math.round(16 * k),
                lineHeight: 1.15,
                color: text,
              }}
            >
              Digital expeditor & smart shift handoff for CNC shops.
            </div>
            <div style={{ fontSize: Math.round(10 * k), color: subtext, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              jobline.ai
            </div>
          </div>
          <div style={{ backgroundColor: C.white, padding: Math.round(4 * k), borderRadius: Math.round(3 * k), lineHeight: 0 }}>
            <QRCodeSVG value={url} size={Math.round(80 * k)} level="M" fgColor={C.navyDeep} bgColor={C.white} />
          </div>
        </>
      )}
    </div>
  );
}
