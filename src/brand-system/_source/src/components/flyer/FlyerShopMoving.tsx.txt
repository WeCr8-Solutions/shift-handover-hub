/**
 * JobLine.ai — FlyerShopMoving Component
 * "KEEP YOUR WORK MOVING..." — Shop floor / auto repair poster
 *
 * Source: 1000011678.jpg — 4 variants extracted
 * URL: jobline.ai/start
 * CTA: "SCAN TO SEE YOUR SHOP LIVE"
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../tokens';
import { JobLineLogo } from '../brand/JobLineLogo';
import type { BaseFlyerProps, BulletItem } from '../../types/brand.types';

interface FlyerShopMovingProps extends BaseFlyerProps {
  /** Variant drives sub-headline / image context */
  variant?: 'manufacturing' | 'auto-repair' | 'welding' | 'generic';
}

const DEFAULT_BULLETS: BulletItem[] = [
  { text: 'Scan the QR code' },
  { text: 'Takes 60 seconds' },
  { text: 'Live on your floor in minutes' },
];

const VARIANT_LABELS: Record<string, string> = {
  'manufacturing': 'Real-time job tracking for manufacturing shops',
  'auto-repair':   'Real-time job tracking for small auto repair shops',
  'welding':       'Real-time job tracking for fabrication & welding shops',
  'generic':       'Real-time job tracking for your shop floor',
};

export const FlyerShopMoving: React.FC<FlyerShopMovingProps> = ({
  variant = 'generic',
  utmSource,
  utmCampaign,
  qrOverride,
  onCTAPress,
}) => {
  const url = 'https://jobline.ai/start';

  const handlePress = () => {
    if (onCTAPress) {
      onCTAPress(url);
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <JobLineLogo scale={0.9} />
      </View>

      {/* Hero Headline */}
      <View style={styles.heroSection}>
        <Text style={styles.heroLine1}>KEEP YOUR WORK</Text>
        <Text style={styles.heroLine2}>MOVING...</Text>

        {/* Feature strip — auto repair variant */}
        {variant === 'auto-repair' && (
          <View style={styles.featureStrip}>
            <FeatureCol icon="🚗" title="EVERY JOB" subtitle="See status, priority & what's next — in real time" />
            <FeatureCol icon="✅" title="EVERY TOUCHPOINT" subtitle="From check-in to completion, nothing slips" />
            <FeatureCol icon="🔄" title="BETTER HANDOFFS" subtitle="Keep your team aligned. Keep customers happy." />
          </View>
        )}
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>{VARIANT_LABELS[variant]}</Text>
      <Text style={styles.subtitleGreen}>Simple. Fast. Built for the way you work.</Text>

      {/* CTA Block */}
      <View style={styles.ctaBlock}>
        <View style={styles.ctaLeft}>
          <Text style={styles.ctaPrimary}>TRY IT FREE</Text>
          <Text style={styles.ctaSecondary}>ON YOUR SHOP{'\n'}RIGHT NOW</Text>
          {DEFAULT_BULLETS.map((b, i) => (
            <BulletRow key={i} text={b.text} />
          ))}
        </View>
        {/* QR placeholder */}
        <View style={styles.qrBox}>
          <Text style={styles.qrPlaceholder}>QR</Text>
          <Text style={styles.qrNote}>Scan</Text>
        </View>
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handlePress}>
          <Text style={styles.scanCTA}>SCAN TO SEE YOUR SHOP LIVE</Text>
          <Text style={styles.urlText}>jobline.ai/start</Text>
        </TouchableOpacity>
      </View>

      {/* Footer tagline */}
      <View style={styles.footerRow}>
        <Text style={styles.footerBold}>BUILT FOR SMALL SHOPS.</Text>
        <Text style={styles.footerGreen}> BIG IMPACT.</Text>
        <Text style={styles.footerUrl}> | jobline.ai/start</Text>
      </View>
    </View>
  );
};

/** Feature column — used in auto-repair variant */
const FeatureCol: React.FC<{ icon: string; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <View style={featureStyles.col}>
    <Text style={featureStyles.icon}>{icon}</Text>
    <Text style={featureStyles.title}>{title}</Text>
    <Text style={featureStyles.subtitle}>{subtitle}</Text>
  </View>
);

const BulletRow: React.FC<{ text: string }> = ({ text }) => (
  <View style={bulletStyles.row}>
    <Text style={bulletStyles.check}>✓</Text>
    <Text style={bulletStyles.text}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.navyDeep,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    ...Shadow.flyer,
  },
  header: {
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyBorder,
    marginBottom: Spacing.lg,
  },
  heroSection: {
    marginBottom: Spacing.md,
  },
  heroLine1: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.display1,
    fontWeight: FontWeight.extraBold,
    color: Colors.white,
    textTransform: 'uppercase',
    lineHeight: FontSize.display1 * 1.1,
  },
  heroLine2: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.display1,
    fontWeight: FontWeight.extraBold,
    color: Colors.teal,
    textTransform: 'uppercase',
    lineHeight: FontSize.display1 * 1.15,
    marginBottom: Spacing.sm,
  },
  featureStrip: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
    color: Colors.subtext,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  subtitleGreen: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
    color: Colors.teal,
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  ctaBlock: {
    flexDirection: 'row',
    backgroundColor: Colors.navyCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  ctaLeft: {
    flex: 1,
  },
  ctaPrimary: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.extraBold,
    color: Colors.green,
    textTransform: 'uppercase',
  },
  ctaSecondary: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  qrBox: {
    width: 72,
    height: 72,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  qrPlaceholder: {
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.navyDeep,
  },
  qrNote: {
    fontSize: FontSize.micro,
    color: Colors.subtext,
  },
  bottomBar: {
    backgroundColor: Colors.navyCard,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scanCTA: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.extraBold,
    color: Colors.white,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  urlText: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: FontSize.h2,
    color: Colors.teal,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: Spacing.sm,
  },
  footerBold: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    textTransform: 'uppercase',
  },
  footerGreen: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.green,
    textTransform: 'uppercase',
  },
  footerUrl: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.label,
    color: Colors.subtext,
  },
});

const featureStyles = StyleSheet.create({
  col: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  icon: {
    fontSize: FontSize.h2,
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.labelSmall,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.micro,
    color: Colors.subtext,
    textAlign: 'center',
  },
});

const bulletStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  check: {
    color: Colors.green,
    fontSize: FontSize.bodySmall,
    marginRight: 4,
    fontWeight: FontWeight.bold,
  },
  text: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
    color: Colors.whiteOff,
  },
});

export default FlyerShopMoving;
