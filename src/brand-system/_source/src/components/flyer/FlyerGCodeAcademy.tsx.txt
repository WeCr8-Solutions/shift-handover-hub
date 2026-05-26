/**
 * JobLine.ai — FlyerGCodeAcademy Component
 * "G CODE ACADEMY — MASTER G CODE. BUILD YOUR FUTURE."
 * "CODE IT. RUN IT. GET IT DONE."
 *
 * Source: 1000012405.png (row 1 panel 4 + row 2 panel 4)
 * URL: jobline.ai/gca
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../tokens';
import { JobLineLogo } from '../brand/JobLineLogo';
import type { BaseFlyerProps } from '../../types/brand.types';

const BULLETS = [
  'G Code Basics to Advanced',
  'Real-world examples',
  'Hands-on learning',
  'Test your knowledge',
  'Level up your career',
];

const GCODE_SAMPLE = `G00 X1.000 Y2.000
G01 Z-0.250 F12.0
G02 X1.500 Y-1.250 R0.500
G03 X0.000 Y0.000 R1.000
M30`;

export const FlyerGCodeAcademy: React.FC<BaseFlyerProps> = ({ onCTAPress }) => {
  const url = 'https://jobline.ai/gca';
  const handlePress = () => onCTAPress ? onCTAPress(url) : Linking.openURL(url);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <JobLineLogo scale={0.85} />
      </View>

      {/* Hero headline */}
      <Text style={styles.programLabel}>G CODE ACADEMY</Text>
      <Text style={styles.headline1}>MASTER G CODE.</Text>
      <Text style={styles.headlineTeal}>BUILD YOUR FUTURE.</Text>

      <Text style={styles.sub}>Free online training for{'\n'}CNC programmers and machinists.</Text>

      {/* G-code sample display */}
      <View style={styles.gcodeBox}>
        <Text style={styles.gcodeText}>{GCODE_SAMPLE}</Text>
      </View>

      {/* Bullets */}
      <View style={styles.bulletList}>
        {BULLETS.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.bulletText}>{b}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.ctaBlock} onPress={handlePress}>
        <View style={styles.qrBox}><Text style={styles.qrLabel}>QR</Text></View>
        <View>
          <Text style={styles.ctaStart}>START TRAINING TODAY</Text>
          <Text style={styles.ctaFree}>START LEARNING TODAY FOR FREE</Text>
          <Text style={styles.ctaUrl}>jobline.ai/gca</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.footer}>LEARN. PRACTICE. PROGRAM. SUCCEED.</Text>
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
  programLabel: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.subtext,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2,
  },
  headline1: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.display2,
    fontWeight: FontWeight.extraBold,
    color: Colors.white,
    textTransform: 'uppercase',
    lineHeight: FontSize.display2 * 1.0,
  },
  headlineTeal: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.display2,
    fontWeight: FontWeight.extraBold,
    color: Colors.teal,
    textTransform: 'uppercase',
    lineHeight: FontSize.display2 * 1.0,
    marginBottom: Spacing.sm,
  },
  sub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.whiteOff,
    lineHeight: FontSize.body * 1.5,
    marginBottom: Spacing.md,
  },
  gcodeBox: {
    backgroundColor: Colors.navyCard,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.teal,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  gcodeText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.bodySmall,
    color: Colors.teal,
    lineHeight: FontSize.bodySmall * 1.6,
  },
  bulletList: { marginBottom: Spacing.lg, gap: Spacing.xs },
  bulletRow: { flexDirection: 'row', alignItems: 'center' },
  check: {
    color: Colors.green,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    marginRight: Spacing.xs,
  },
  bulletText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.whiteOff,
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
  ctaStart: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.body,
    fontWeight: FontWeight.extraBold,
    color: Colors.green,
    textTransform: 'uppercase',
  },
  ctaFree: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.bodySmall,
    color: Colors.white,
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

export default FlyerGCodeAcademy;
