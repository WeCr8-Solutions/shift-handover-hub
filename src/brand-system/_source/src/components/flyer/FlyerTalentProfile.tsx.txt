/**
 * JobLine.ai — FlyerTalentProfile Component
 * "BUILD YOUR CAREER. SHOW YOUR SKILLS."
 * Also: "YOUR SKILLS. YOUR RECORD. YOUR FUTURE."
 *
 * Source: 1000012405.png (top-left + bottom-right panels)
 * URL: jobline.ai/talent
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../tokens';
import { JobLineLogo } from '../brand/JobLineLogo';
import type { BaseFlyerProps } from '../../types/brand.types';

interface FlyerTalentProfileProps extends BaseFlyerProps {
  /** Headline variant extracted from collateral */
  variant?: 'build-career' | 'your-skills';
}

const BULLETS_BUILD = [
  'Skills & certifications',
  'Machine experience',
  'Job history',
  'Training records',
  'Portfolio that works as hard as you do',
];

const BULLETS_SKILLS = [
  'Earn certifications',
  'Get mentor support',
  'Track your skills',
  'Stand out to employers',
  'Take your career anywhere',
];

export const FlyerTalentProfile: React.FC<FlyerTalentProfileProps> = ({
  variant = 'build-career',
  onCTAPress,
}) => {
  const url = 'https://jobline.ai/talent';
  const isBuildCareer = variant === 'build-career';

  const handlePress = () => {
    if (onCTAPress) onCTAPress(url);
    else Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <JobLineLogo scale={0.85} />
      </View>

      {/* Headline */}
      <View style={styles.headlineBlock}>
        {isBuildCareer ? (
          <>
            <Text style={styles.headlineWhite}>BUILD YOUR CAREER.</Text>
            <Text style={styles.headlineTeal}>SHOW YOUR SKILLS.</Text>
          </>
        ) : (
          <>
            <Text style={styles.headlineWhite}>YOUR SKILLS.</Text>
            <Text style={styles.headlineWhite}>YOUR RECORD.</Text>
            <Text style={styles.headlineTeal}>YOUR FUTURE.</Text>
          </>
        )}
      </View>

      {/* Sub-headline */}
      <Text style={styles.subHeadline}>
        {isBuildCareer
          ? 'Create your free manufacturing\ntalent profile today.'
          : 'The Operator Acceptance Program (OAP) is your career passport.'}
      </Text>

      {/* Bullet list */}
      <View style={styles.bulletList}>
        {(isBuildCareer ? BULLETS_BUILD : BULLETS_SKILLS).map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bulletCheck}>✓</Text>
            <Text style={styles.bulletText}>{b}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.ctaBlock} onPress={handlePress}>
        <View style={styles.qrBox}>
          <Text style={styles.qrLabel}>QR</Text>
        </View>
        <View style={styles.ctaText}>
          <Text style={styles.ctaScan}>
            {isBuildCareer
              ? 'SCAN TO CREATE\nYOUR FREE TALENT\nPROFILE TODAY'
              : 'JOIN THE OAP\nJOIN THE FUTURE'}
          </Text>
          <Text style={styles.ctaUrl}>jobline.ai/talent</Text>
        </View>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>REAL PROFILES. REAL OPPORTUNITIES.</Text>
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
  header: {
    marginBottom: Spacing.md,
  },
  headlineBlock: {
    marginBottom: Spacing.sm,
  },
  headlineWhite: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.display2,
    fontWeight: FontWeight.extraBold,
    color: Colors.white,
    textTransform: 'uppercase',
    lineHeight: FontSize.display2 * 1.05,
  },
  headlineTeal: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.display2,
    fontWeight: FontWeight.extraBold,
    color: Colors.teal,
    textTransform: 'uppercase',
    lineHeight: FontSize.display2 * 1.05,
    marginBottom: Spacing.sm,
  },
  subHeadline: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.whiteOff,
    marginBottom: Spacing.md,
    lineHeight: FontSize.body * 1.5,
  },
  bulletList: {
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletCheck: {
    color: Colors.green,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    marginRight: Spacing.xs,
  },
  bulletText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.whiteOff,
    flex: 1,
  },
  ctaBlock: {
    backgroundColor: Colors.navyCard,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.teal,
  },
  qrBox: {
    width: 64,
    height: 64,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  qrLabel: {
    fontWeight: FontWeight.bold,
    fontSize: FontSize.h3,
    color: Colors.navyDeep,
  },
  ctaText: {
    flex: 1,
  },
  ctaScan: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.body,
    fontWeight: FontWeight.extraBold,
    color: Colors.green,
    textTransform: 'uppercase',
    lineHeight: FontSize.body * 1.3,
    marginBottom: 4,
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

export default FlyerTalentProfile;
