/**
 * JobLine.ai — Logo (web)
 * Cleaned, React DOM port of src/brand-system/_source/src/components/brand/JobLineLogo.tsx.txt
 *
 * Renders: ■■■▶ JobLine.ai
 * Uses brand-print colors directly (not semantic tokens) — the logo must
 * always render in brand colors regardless of surrounding theme.
 */

import { BrandPrintColors, BrandFonts } from "./brandPrintTokens";
import { cn } from "@/lib/utils";

interface JobLineLogoProps {
  /** Scale multiplier — 1 = ~18px text. */
  scale?: number;
  variant?: "default" | "white" | "teal" | "dark";
  showMark?: boolean;
  className?: string;
}

export function JobLineLogo({
  scale = 1,
  variant = "default",
  showMark = true,
  className,
}: JobLineLogoProps) {
  const fontSize = 18 * scale;
  const markSize = fontSize * 0.55;

  const textColor =
    variant === "teal" ? BrandPrintColors.teal :
    variant === "dark" ? BrandPrintColors.navyDeep :
    BrandPrintColors.white;

  const squareBg = variant === "dark" ? BrandPrintColors.navyDeep : BrandPrintColors.navyMid;

  return (
    <span className={cn("inline-flex items-center", className)}>
      {showMark && (
        <span className="inline-flex items-center" style={{ marginRight: 6 * scale }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: markSize,
                height: markSize,
                marginRight: i === 2 ? 3 * scale : 2 * scale,
                backgroundColor: squareBg,
                border: `1px solid ${BrandPrintColors.navyBorder}`,
                borderRadius: 1,
                display: "inline-block",
              }}
            />
          ))}
          <span
            style={{
              fontSize: markSize * 1.2,
              color: BrandPrintColors.teal,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            ▶
          </span>
        </span>
      )}
      <span
        style={{
          fontFamily: BrandFonts.display,
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: textColor,
          lineHeight: 1,
        }}
      >
        JobLine
        <span style={{ color: BrandPrintColors.teal }}>.ai</span>
      </span>
    </span>
  );
}

interface LogoMarkProps {
  size?: number;
  variant?: "default" | "teal" | "white";
  className?: string;
}

export function LogoMark({ size = 24, variant = "default", className }: LogoMarkProps) {
  const squareSize = size * 0.28;
  const gap = size * 0.06;
  const squareColor =
    variant === "teal" ? BrandPrintColors.teal :
    variant === "white" ? BrandPrintColors.white :
    BrandPrintColors.navyMid;

  return (
    <span
      className={cn("inline-flex items-center", className)}
      style={{ height: size }}
      aria-label="JobLine.ai mark"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: squareSize,
            height: squareSize,
            backgroundColor: squareColor,
            marginRight: i === 2 ? gap * 1.5 : gap,
            borderRadius: 1,
            display: "inline-block",
          }}
        />
      ))}
      <span style={{ fontSize: squareSize * 1.2, color: BrandPrintColors.teal, lineHeight: 1 }}>
        ▶
      </span>
    </span>
  );
}
