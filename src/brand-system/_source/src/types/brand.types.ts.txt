/**
 * JobLine.ai — Shared Brand TypeScript Interfaces
 */

/** All branded product lines across JobLine.ai ecosystem */
export type ProductLine =
  | 'talent'       // jobline.ai/talent — talent profiles
  | 'oap'          // jobline.ai/oap — Operator Acceptance Program
  | 'learn'        // jobline.ai/learn — Learn AI hub
  | 'gca'          // jobline.ai/gca — G Code Academy
  | 'start'        // jobline.ai/start — shop floor onboarding
  | 'shop';        // general shop floor / JobLine.ai core

/** Campaign / flyer variant identifiers */
export type FlyerVariant =
  | 'shop-moving'
  | 'talent-profile'
  | 'oap'
  | 'learn-ai'
  | 'gcode-academy';

/** Business card sides */
export type CardSide = 'front' | 'back';

/** Card theme variants */
export type CardTheme = 'dark' | 'light';

/** Bullet point item used across flyer components */
export interface BulletItem {
  text: string;
  /** Override bullet color (defaults to Colors.green) */
  color?: string;
}

/** Icon feature row (used in flyer feature grids) */
export interface FeatureItem {
  icon: string;      // emoji or icon name string
  title: string;
  subtitle?: string;
}

/** CTA section data */
export interface CTAProps {
  /** Primary CTA text e.g. "TRY IT FREE" */
  primaryText: string;
  /** Secondary CTA text e.g. "ON YOUR SHOP RIGHT NOW" */
  secondaryText?: string;
  /** URL slug e.g. "jobline.ai/start" */
  url: string;
  /** UTM source for tracking — connects to Batch 02 GA4 */
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  /** Whether to show QR code */
  showQR?: boolean;
  /** QR code value override — defaults to url */
  qrValue?: string;
  /** Bullet list items below CTA */
  bullets?: BulletItem[];
}

/** Logo display props */
export interface LogoProps {
  /** Scale multiplier — default 1 */
  scale?: number;
  /** Color variant */
  variant?: 'default' | 'white' | 'teal' | 'dark';
  /** Show/hide the logomark squares */
  showMark?: boolean;
}

/** Full flyer props base */
export interface BaseFlyerProps {
  /** UTM tracking for QR code generation */
  utmSource?: string;
  utmCampaign?: string;
  /** Custom QR override value */
  qrOverride?: string;
  /** Flyer width in pts — for print sizing */
  width?: number;
  /** Callback when CTA is tapped (in-app usage) */
  onCTAPress?: (url: string) => void;
}

/** Business card props */
export interface BusinessCardProps {
  productLine: ProductLine;
  side: CardSide;
  theme?: CardTheme;
  /** Optional custom URL override */
  urlOverride?: string;
}
