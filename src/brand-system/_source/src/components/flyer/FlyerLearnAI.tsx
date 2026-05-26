/**
 * JobLine.ai — FlyerLearnAI Component
 * "LEARN AI. APPLY IT. BUILD THE FUTURE OF MANUFACTURING."
 *
 * Source: 1000012405.png (row 1, panel 3)
 * URL: jobline.ai/learn
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../tokens';
import { JobLineLogo } from '../brand/JobLineLogo';
import type { BaseFlyerProps } from '../../types/brand.types';

const LEARN_SECTIONS = [
  {
    icon: '🤖',
    title: 'AI TERMS EXPLAINED',
    body: 'Simple definitions for real-world use',
  },
  {
    icon: '🏭',
    title: 'USE CASES THAT MATTER',
    body: 'AI in machining, quality, maintenance, & more',
  },
  {
    icon: '💡',
    title: 'PRACTICAL KNOWLEDGE',
    body: 'Real examples. Real impact. Real easy to understand.',
  },
];

export const FlyerLearnAI: React.FC<BaseFlyerProps> = ({ onCTAPress }) => {
  const url = 'https://jobline.ai/learn';
  const handlePress = () => onCTAPress ? onCTAPress(url) : Linking.openURL(url);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <JobLineLogo scale={0.85} />
      </View>

      <Text style={styles.headline1}>LEARN AI.</Text>
      <Text style={styles.headline2}>APPLY IT.</Text>
      <Text style={styles.headlineTeal}>BUILD THE FUTURE{'\n'}OF MANUFACTURING.</Text>

      <Text style={styles.sub}>Free learning hub for{'\n'}manufacturing professionals.</Text>

      <View style={styles.sections}>
        {LEARN_SECTIONS.map((s, i) => (
          <View key={i} style={styles.sectionRow}>
            <Text style={styles.sectionIcon}>{s.icon}</Text>
            <View style={styles.sectionBody}>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              <Text style={styles.sectionText}>{s.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.ctaBlock} onPress={handlePress}>
        <View style={styles.qrBox}><Text style={styles.qrLabel}>QR</Text></View>
        <View>
          <Text style={styles.ctaAction}>EXPLORE. LEARN. APPLY.</Text>
          <Text style={styles.ctaScan}>START LEARNING NOW</Text>
          <Text style={styles.ctaUrl}>jobline.ai/learn</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.footer}>AI KNOWLEDGE. MANUFACTURING IMPACT.</Text>
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
  headline1: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.display2,
    fontWeight: FontWeight.extraBold,
    color: Colors.white,
    textTransform: 'uppercase',
    lineHeight: FontSize.display2 * 1.0,
  },
  headline2: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.display2,
    fontWeight: FontWeight.extraBold,
    color: Colors.white,
    textTransform: 'uppercase',
    lineHeight: FontSize.display2 * 1.0,
  },
  headlineTeal: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.h1,
    fontWeight: FontWeight.extraBold,
    color: Colors.teal,
    textTransform: 'uppercase',
    lineHeight: FontSize.h1 * 1.15,
    marginBottom: Spacing.sm,
  },
  sub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.whiteOff,
    marginBottom: Spacing.lg,
    lineHeight: FontSize.body * 1.5,
  },
  sections: { marginBottom: Spacing.lg, gap: Spacing.md },
  sectionRow: { flexDirection: 'row', alignItems: 'flex-start' },
  sectionIcon: { fontSize: FontSize.h2, marginRight: Spacing.sm, marginTop: 2 },
  sectionBody: { flex: 1 },
  sectionTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sectionText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.bodySmall,
    color: Colors.subtext,
    lineHeight: FontSize.bodySmall * 1.5,
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
  ctaAction: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.extraBold,
    color: Colors.green,
    textTransform: 'uppercase',
  },
  ctaScan: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.body,
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

export default FlyerLearnAI;
