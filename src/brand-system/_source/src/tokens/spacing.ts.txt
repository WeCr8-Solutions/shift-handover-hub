/**
 * JobLine.ai — Spacing Tokens
 * 8pt grid system consistent with shop floor UI
 */

export const Spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const BorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 10,
  xl: 16,
  full: 9999,
} as const;

export const Shadow = {
  /** Subtle card shadow */
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  /** Prominent flyer shadow */
  flyer: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  /** Teal glow — for CTA buttons */
  tealGlow: {
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

/** Standard flyer dimensions (points / logical px) */
export const FlyerDimensions = {
  /** Standard portrait flyer — 8.5"x11" at 96dpi equiv */
  portraitWidth: 816,
  portraitHeight: 1056,
  /** Business card — 3.5"x2" */
  cardWidth: 336,
  cardHeight: 192,
  /** Shop poster — landscape variant */
  posterWidth: 1056,
  posterHeight: 816,
} as const;
