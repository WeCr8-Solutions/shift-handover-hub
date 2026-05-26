/**
 * JobLine.ai — BusinessCard Component
 * Renders front (dark navy) and back (light) variants of business cards
 * Extracted from: 1000012406.png — JOBLINE.AI ECOSYSTEM business card options
 *
 * 4 product lines × front/back = 8 cards per set
 * All cards: 3.5" × 2" — use FlyerDimensions.cardWidth/cardHeight for print
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../tokens';
import { JobLineLogo } from '../brand/JobLineLogo';
import type { BusinessCardProps } from '../../types/brand.types';

interface CardContent {
  headline: string;
  subHeadline?: string;
  tagline?: string;
  bullets?: string[];
  url: string;
  ctaLabel?: string;
  backTitle?: string;
  backSubtitle?: string;
  backBullets?: string[];
}

const CARD_CONTENT: Record<string, CardContent> = {
  talent: {
    headline: 'BUILD YOUR CAREER.\nSHOW YOUR SKILLS.',
    tagline: 'Free Manufacturing Talent Profile',
    bullets: ['Skills & Certifications', 'Machine Experience', 'Training & Education', 'Job History', 'Portfolio & Achievements'],
    url: 'https://jobline.ai/talent',
    ctaLabel: 'CREATE YOUR FREE TALENT PROFILE TODAY',
    backTitle: 'ONE PROFILE.\nMORE OPPORTUNITIES.',
    backBullets: ['Stand out to employers', 'Keep your records in one place', 'Portable. Verified. Yours.', 'Built for manufacturing professionals'],
  },
  oap: {
    headline: 'YOUR SKILLS.\nVERIFIED.\nYOUR CAREER.\nELEVATED.',
    tagline: 'Operator Acceptance Program (OAP)',
    url: 'https://jobline.ai/oap',
    ctaLabel: 'JOIN THE OAP TODAY',
    backTitle: 'THE OAP IS YOUR\nCAREER PASSPORT.',
    backBullets: ['Earn certifications', 'Get mentor support', 'Track your progress', 'Stand out to employers', 'Take your career anywhere'],
  },
  learn: {
    headline: 'APPLY IT.\nBUILD THE FUTURE.',
    tagline: 'AI learning hub for manufacturing professionals.',
    url: 'https://jobline.ai/learn',
    ctaLabel: 'START LEARNING NOW',
    backTitle: 'AI KNOWLEDGE\nMADE SIMPLE.',
    backBullets: ['AI Terms Explained', 'Real-World Use Cases', 'Practical Examples', 'Built for Manufacturing'],
  },
  gca: {
    headline: 'MASTER G CODE.\nBUILD YOUR FUTURE.',
    tagline: 'Free online training for CNC programmers and machinists.',
    url: 'https://jobline.ai/gca',
    ctaLabel: 'START LEARNING TODAY FOR FREE',
    backTitle: 'LEARN. PRACTICE.\nPROGRAM. SUCCEED.',
    backBullets: ['Step-by-step lessons', 'Real G code examples', 'Quizzes & practice', 'From beginner to advanced'],
  },
  start: {
    headline: 'ONE PLATFORM.\nBUILT FOR\nMANUFACTURING.',
    url: 'https://jobline.ai/start',
    ctaLabel: 'TRY IT FREE',
    backTitle: 'TRACK JOBS.\nIMPROVE HANDOFFS.\nEMPOWER YOUR TEAM.',
    backBullets: ['Real-time job tracking', 'Better shift handoffs', 'Supervisor visibility', 'Live on your floor in minutes'],
  },
};

export const BusinessCard: React.FC<BusinessCardProps> = ({
  productLine,
  side,
  theme = 'dark',
  urlOverride,
}) => {
  const content = CARD_CONTENT[productLine] ?? CARD_CONTENT.start;
  const url = urlOverride ?? content.url;
  const handlePress = () => Linking.openURL(url);

  if (side === 'front') {
    return <CardFront content={content} url={url} onPress={handlePress} />;
  }
  return <CardBack content={content} url={url} theme={theme} onPress={handlePress} />;
};

const CardFront: React.FC<{ content: CardContent; url: string; onPress: () => void }> = ({
  content, url, onPress
}) => (
  <View style={frontStyles.card}>
    <View style={frontStyles.header}>
      <JobLineLogo scale={0.6} />
    </View>

    <Text style={frontStyles.headline}>{content.headline}</Text>

    {content.tagline && (
      <Text style={frontStyles.tagline}>{content.tagline}</Text>
    )}

    <View style={frontStyles.footer}>
      <TouchableOpacity style={frontStyles.ctaRow} onPress={onPress}>
        <View style={frontStyles.qrMini}>
          <Text style={frontStyles.qrLabel}>QR</Text>
        </View>
        <View>
          {content.ctaLabel && (
            <Text style={frontStyles.ctaLabel}>{content.ctaLabel}</Text>
          )}
          <Text style={frontStyles.urlText}>{url.replace('https://', '')}</Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
);

const CardBack: React.FC<{ content: CardContent; url: string; theme: 'dark' | 'light'; onPress: () => void }> = ({
  content, url, theme, onPress
}) => {
  const isDark = theme === 'dark';
  return (
    <View style={[backStyles.card, isDark ? backStyles.cardDark : backStyles.cardLight]}>
      <Text style={[backStyles.title, isDark ? backStyles.titleDark : backStyles.titleLight]}>
        {content.backTitle ?? content.headline}
      </Text>

      <View style={backStyles.bullets}>
        {(content.backBullets ?? content.bullets ?? []).map((b, i) => (
          <View key={i} style={backStyles.bulletRow}>
            <Text style={backStyles.bulletCheck}>✓</Text>
            <Text style={[backStyles.bulletText, !isDark && backStyles.bulletTextLight]}>{b}</Text>
          </View>
        ))}
      </View>

      <View style={backStyles.footer}>
        <TouchableOpacity onPress={onPress}>
          <Text style={backStyles.footerUrl}>{url.replace('https://', '')}</Text>
        </TouchableOpacity>
        <View style={backStyles.freeBadge}>
          <Text style={backStyles.freeText}>100% FREE</Text>
        </View>
      </View>
    </View>
  );
};

const frontStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.navyDeep,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    width: 280,
    minHeight: 160,
    ...Shadow.card,
    justifyContent: 'space-between',
  },
  header: { marginBottom: Spacing.xs },
  headline: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.h2,
    fontWeight: FontWeight.extraBold,
    color: Colors.white,
    textTransform: 'uppercase',
    lineHeight: FontSize.h2 * 1.05,
    flex: 1,
  },
  tagline: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.labelSmall,
    color: Colors.subtext,
    marginTop: 2,
  },
  footer: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.navyBorder,
    paddingTop: Spacing.xs,
  },
  ctaRow: { flexDirection: 'row', alignItems: 'center' },
  qrMini: {
    width: 36,
    height: 36,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  qrLabel: { fontSize: FontSize.micro, fontWeight: FontWeight.bold, color: Colors.navyDeep },
  ctaLabel: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.green,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urlText: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: FontSize.label,
    color: Colors.teal,
  },
});

const backStyles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    width: 280,
    minHeight: 160,
    ...Shadow.card,
    justifyContent: 'space-between',
  },
  cardDark: { backgroundColor: Colors.navyCard },
  cardLight: { backgroundColor: Colors.lightBg },
  title: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    lineHeight: FontSize.body * 1.2,
    marginBottom: Spacing.xs,
  },
  titleDark: { color: Colors.white },
  titleLight: { color: Colors.lightText },
  bullets: { gap: 2, flex: 1 },
  bulletRow: { flexDirection: 'row', alignItems: 'center' },
  bulletCheck: {
    color: Colors.green,
    fontSize: FontSize.label,
    marginRight: 3,
    fontWeight: FontWeight.bold,
  },
  bulletText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.label,
    color: Colors.whiteOff,
  },
  bulletTextLight: { color: Colors.lightSubtext },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: Spacing.xs,
  },
  footerUrl: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: FontSize.label,
    color: Colors.teal,
  },
  freeBadge: {
    backgroundColor: Colors.teal,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  freeText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.navyDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default BusinessCard;
