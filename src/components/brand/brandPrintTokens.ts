/**
 * JobLine.ai — Print/Brand Color Tokens (web)
 *
 * These are EXACT brand hex values used on physical print collateral
 * (flyers, business cards, shop posters). They intentionally live OUTSIDE
 * the semantic HSL token system because every flyer/card must render
 * with the exact print-spec color regardless of app theme (light/dark).
 *
 * Source of truth: src/brand-system/_source/src/tokens/colors.ts.txt
 * Audit:           src/brand-system/_source/docs/BRAND_AUDIT.md
 *
 * For application chrome (buttons, cards, headers) ALWAYS use semantic
 * tokens from src/index.css instead.
 */

export const BrandPrintColors = {
  // Core backgrounds
  navyDeep: "#0D1B2A",
  navyCard: "#112240",
  navyMid: "#1A2E45",
  navyBorder: "#0A1520",

  // Accents
  teal: "#00C9A7",
  tealLight: "#00E0BC",
  tealMuted: "#007A67",
  green: "#1DB954",
  greenLight: "#22D467",
  greenMuted: "#148A3D",

  // Text
  white: "#FFFFFF",
  whiteOff: "#E8F0F7",
  subtext: "#8899AA",
  muted: "#556677",

  // Light variant
  lightBg: "#F0F4F8",
  lightText: "#0D1B2A",
  lightAccent: "#00A88A",
  lightSubtext: "#445566",
} as const;

export type BrandPrintColorKey = keyof typeof BrandPrintColors;

/** Inline-style helpers for components that prefer style objects over arbitrary classes */
export const brandStyle = {
  bgNavy: { backgroundColor: BrandPrintColors.navyDeep },
  bgNavyCard: { backgroundColor: BrandPrintColors.navyCard },
  bgLight: { backgroundColor: BrandPrintColors.lightBg },
  textWhite: { color: BrandPrintColors.white },
  textWhiteOff: { color: BrandPrintColors.whiteOff },
  textTeal: { color: BrandPrintColors.teal },
  textGreen: { color: BrandPrintColors.green },
  textSubtext: { color: BrandPrintColors.subtext },
  borderTeal: { borderColor: BrandPrintColors.teal },
} as const;

/** Standard print dimensions (px @ 96dpi) for preview canvases */
export const PrintDimensions = {
  portraitFlyer: { width: 816, height: 1056 },     // 8.5"x11"
  landscapePoster: { width: 1056, height: 816 },
  businessCard: { width: 336, height: 192 },       // 3.5"x2"
} as const;

/** Brand font stack — loaded via Google Fonts CDN already in index.html */
export const BrandFonts = {
  display: '"Montserrat", "Inter", system-ui, sans-serif',
  body: '"Open Sans", "Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", "Source Code Pro", monospace',
} as const;
