/**
 * JobLine.ai — FlyerOAP Component
 * "OPERATOR ACCEPTANCE PROGRAM (OAP)"
 * "YOUR SKILLS. VERIFIED. YOUR CAREER. ELEVATED."
 *
 * Source: 1000012405.png (top-right panel)
 * URL: jobline.ai/oap
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../tokens';
import { JobLineLogo } from '../brand/JobLineLogo';
import type { BaseFlyerProps } from '../../types/brand.types';

const FEATURE_ITEMS = [
  { icon: '🏆', title: 'Earn & track certifications' },
  { icon: '🧑‍🏫', title: 'Mentor guidance' },
  { icon: '📋', title: 'Enterprise qualification paths' },
  { icon: '✅', title: 'Skills verification' },
  { icon: '📡', title: 'Workforce visibility' },
];

export const FlyerOAP: React.FC<BaseFlyerProps> = ({ onCTAPress }) => {
  const url = 'https://jobline.ai/oap';
  const handlePress = () => onCTAPress ? onCTAPress(url) : Linking.openURL(url);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <JobLineLogo scale={0.85} />
      </View>

      <Text style={styles.title}>OPERATOR ACCEPTANCE{'\n'}PROGRAM (OAP)</Text>
      <Text style={styles.tagline}>Your skills. Verified.{'\n'}Your career. Elevated.</Text>

      <View style={styles.featureList}>
        {FEATURE_ITEMS.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>{f.title}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.portable}>Portable. Trusted. Yours.</Text>

      <TouchableOpacity style={styles.ctaBlock} onPress={handlePress}>
        <View style={styles.qrBox}><Text style={styles.qrLabel}>QR</Text></View>
        <View>
          <Text style={styles.ctaJoin}>JOIN THE OAP TODAY</Text>
          <Text style={styles.ctaUrl}>jobline.ai/oap</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.footer}>REAL SKILLS. REAL VERIFICATION. REAL OPPORTUNITIES.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.navyDeep,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    ...Shadow.flyer,
  },
  header: { marginBottom: Spacing.md },
  title: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.display2,
    fontWeight: FontWeight.extraBold,
    color: Colors.white,
    textTransform: 'uppercase',
    lineHeight: FontSize.display2 * 1.05,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.teal,
    marginBottom: Spacing.lg,
    lineHeight: FontSize.h2 * 1.3,
  },
  featureList: { marginBottom: Spacing.md, gap: Spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  featureCheck: {
    color: Colors.green,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    marginRight: Spacing.xs,
  },
  featureText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.whiteOff,
  },
  portable: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.body,
    color: Colors.subtext,
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  ctaBlock: {
    backgroundColor: Colors.navyCard,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.teal,
    marginBottom: Spacing.sm,
  },
  qrBox: {
    width: 64, height: 64,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  qrLabel: { fontWeight: FontWeight.bold, fontSize: FontSize.h3, color: Colors.navyDeep },
  ctaJoin: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.extraBold,
    color: Colors.green,
    textTransform: 'uppercase',
  },
  ctaUrl: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: FontSize.h3,
    color: Colors.teal,
  },
  footer: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.label,
    color: Colors.subtext,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    paddingTop: Spacing.sm,
  },
});

export default FlyerOAP;
