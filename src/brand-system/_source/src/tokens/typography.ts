/**
 * JobLine.ai — Typography Tokens
 * Fonts identified from collateral:
 *   - Headlines/Display: Montserrat (ExtraBold 800, Bold 700)
 *   - Body/Labels: Open Sans (Regular 400, SemiBold 600)
 *   - Monospace (G Code Academy): Source Code Pro / Courier New fallback
 */

export const FontFamily = {
  /** Primary display/headline font — Montserrat */
  display: 'Montserrat_800ExtraBold',
  displayBold: 'Montserrat_700Bold',
  displaySemiBold: 'Montserrat_600SemiBold',
  /** Body / UI font — Open Sans */
  body: 'OpenSans_400Regular',
  bodySemiBold: 'OpenSans_600SemiBold',
  bodyBold: 'OpenSans_700Bold',
  /** Monospace — for G-code display */
  mono: 'SourceCodePro_400Regular',
  /** System fallbacks */
  systemSans: 'System',
} as const;

export const FontSize = {
  /** Large display — main flyer hero headline */
  display1: 36,
  display2: 30,
  display3: 26,
  /** Section headline */
  h1: 22,
  h2: 18,
  h3: 16,
  /** Body text */
  body: 14,
  bodySmall: 12,
  /** Labels / caps */
  label: 11,
  labelSmall: 10,
  /** Micro / footer */
  micro: 9,
} as const;

export const FontWeight = {
  regular: '400' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
} as const;

export const LineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
  caps: 3,
} as const;

/** Pre-built text style objects for common use cases */
export const TextStyles = {
  /** Hero headline — large flyer title */
  flyerHero: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.display1,
    fontWeight: FontWeight.extraBold,
    lineHeight: FontSize.display1 * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
    color: '#FFFFFF',
  },
  /** Accent headline — teal colored sub-headline */
  flyerAccent: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.display2,
    fontWeight: FontWeight.extraBold,
    lineHeight: FontSize.display2 * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
    color: '#00C9A7',
  },
  /** Section headline */
  sectionHeadline: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.h1 * LineHeight.snug,
    color: '#FFFFFF',
  },
  /** Body text */
  body: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.body * LineHeight.relaxed,
    color: '#E8F0F7',
  },
  /** Small label / caps */
  labelCaps: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.semiBold,
    letterSpacing: LetterSpacing.caps,
    textTransform: 'uppercase' as const,
    color: '#8899AA',
  },
  /** CTA label */
  ctaLabel: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.extraBold,
    letterSpacing: LetterSpacing.wide,
    color: '#1DB954',
  },
  /** URL / domain text */
  urlText: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.semiBold,
    letterSpacing: LetterSpacing.normal,
    color: '#00C9A7',
  },
  /** G-code monospace */
  gcode: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.bodySmall * LineHeight.relaxed,
    color: '#00C9A7',
  },
} as const;
