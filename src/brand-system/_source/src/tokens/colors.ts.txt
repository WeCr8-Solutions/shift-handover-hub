/**
 * JobLine.ai — Brand Color Tokens
 * Extracted from: flyer sheets, business card ecosystem, shop posters
 * Source audit: docs/BRAND_AUDIT.md
 *
 * DO NOT modify hex values without updating CHANGELOG.md and BRAND_AUDIT.md
 */

export const Colors = {
  // ── Core Backgrounds ──────────────────────────────────
  /** Primary dark navy — all flyer/card backgrounds */
  navyDeep: '#0D1B2A',
  /** Card surface blue — inner panel backgrounds */
  navyCard: '#112240',
  /** Slightly lighter navy — hover/pressed states */
  navyMid: '#1A2E45',
  /** Near-black for outer borders/shadows */
  navyBorder: '#0A1520',

  // ── Brand Accents ─────────────────────────────────────
  /** Teal accent — logo ".ai", key headlines, scan CTAs */
  teal: '#00C9A7',
  /** Teal hover — slightly brighter interactive state */
  tealLight: '#00E0BC',
  /** Teal muted — secondary teal text on dark */
  tealMuted: '#007A67',

  /** CTA green — bullet checkmarks, "TRY IT FREE" labels */
  green: '#1DB954',
  /** Green light — lighter green used in scan CTAs */
  greenLight: '#22D467',
  /** Green muted — soft green on dark panels */
  greenMuted: '#148A3D',

  // ── Text ──────────────────────────────────────────────
  /** Primary text — headlines, body on dark */
  white: '#FFFFFF',
  /** Off-white — softer body copy */
  whiteOff: '#E8F0F7',
  /** Subtext / secondary labels */
  subtext: '#8899AA',
  /** Muted label — small caps, footer text */
  muted: '#556677',

  // ── Light Card (back-of-card / ecosystem light variant) ──
  /** Light card background — white-theme business card back */
  lightBg: '#F0F4F8',
  /** Light card text — dark navy on light bg */
  lightText: '#0D1B2A',
  /** Light card accent — teal on light bg */
  lightAccent: '#00A88A',
  /** Light card subtext */
  lightSubtext: '#445566',

  // ── Semantic / Status ─────────────────────────────────
  /** Success / verified indicator */
  success: '#1DB954',
  /** Warning / flag */
  warning: '#F59E0B',
  /** Error / NCR flag */
  error: '#EF4444',
  /** Info / neutral indicator */
  info: '#3B82F6',

  // ── Utility ───────────────────────────────────────────
  transparent: 'transparent',
  /** Semi-transparent dark overlay for image backgrounds */
  overlayDark: 'rgba(13, 27, 42, 0.82)',
  /** Light scrim for QR code panels */
  overlayLight: 'rgba(255, 255, 255, 0.08)',
} as const;

export type ColorKey = keyof typeof Colors;

/**
 * Semantic aliases — use these in components for intent clarity
 */
export const SemanticColors = {
  background: Colors.navyDeep,
  surface: Colors.navyCard,
  surfaceElevated: Colors.navyMid,
  border: Colors.navyBorder,
  primary: Colors.teal,
  primaryHover: Colors.tealLight,
  cta: Colors.green,
  ctaHover: Colors.greenLight,
  textPrimary: Colors.white,
  textSecondary: Colors.whiteOff,
  textMuted: Colors.subtext,
  textDisabled: Colors.muted,
} as const;
