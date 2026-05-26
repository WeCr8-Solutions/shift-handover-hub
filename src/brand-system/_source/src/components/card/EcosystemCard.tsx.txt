/**
 * JobLine.ai — EcosystemCard Component
 * Renders all 4 product lines as a scrollable card discovery grid
 * Maps directly to the JOBLINE.AI ECOSYSTEM business card sheet layout
 *
 * Source: 1000012406.png — full 4×4 card matrix
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../tokens';
import { JobLineLogo } from '../brand/JobLineLogo';

interface EcosystemCardProps {
  /** Show all 4 product lines or just one */
  filter?: 'talent' | 'oap' | 'learn' | 'gca';
  onProductPress?: (productLine: string, url: string) => void;
  /** Layout — horizontal scroll or vertical grid */
  layout?: 'scroll' | 'grid';
}

const PRODUCTS = [
  {
    id: 'talent',
    label: 'TALENT SYSTEM',
    headline: 'BUILD YOUR CAREER.\nSHOW YOUR SKILLS.',
    accentLine: null,
    tagline: 'Free Manufacturing Talent Profile',
    url: 'https://jobline.ai/talent',
    ctaLabel: 'CREATE YOUR FREE PROFILE',
    bullets: ['Skills & Certifications', 'Machine Experience', 'Job History', 'Portfolio & Achievements'],
  },
  {
    id: 'oap',
    label: 'OAP',
    headline: 'YOUR SKILLS.\nVERIFIED.\nYOUR CAREER.\nELEVATED.',
    accentLine: 'OPERATOR ACCEPTANCE PROGRAM (OAP)',
    tagline: 'Verify. Grow. Advance.',
    url: 'https://jobline.ai/oap',
    ctaLabel: 'JOIN THE OAP TODAY',
    bullets: ['Certifications & Training', 'Mentor Guidance', 'Skills Verification', 'Portable & Trusted'],
  },
  {
    id: 'learn',
    label: 'LEARN AI LEARNING HUB',
    headline: 'LEARN.\nUNDERSTAND.\nAPPLY AI.',
    accentLine: null,
    tagline: 'Made for Manufacturing.',
    url: 'https://jobline.ai/learn',
    ctaLabel: 'START LEARNING NOW',
    bullets: ['AI Terms Explained', 'Real-World Use Cases', 'Practical Examples', 'Built for Manufacturing'],
  },
  {
    id: 'gca',
    label: 'G CODE ACADEMY',
    headline: 'MASTER G CODE.\nBUILD YOUR\nFUTURE.',
    accentLine: 'CODE IT. RUN IT. GET IT DONE.',
    tagline: 'Free training for CNC professionals.',
    url: 'https://jobline.ai/gca',
    ctaLabel: 'START LEARNING FREE',
    bullets: ['G Code Basics to Advanced', 'Real G Code Examples', 'Quizzes & Practice', 'Built for CNC Professionals'],
  },
];

export const EcosystemCard: React.FC<EcosystemCardProps> = ({
  filter,
  onProductPress,
  layout = 'scroll',
}) => {
  const products = filter ? PRODUCTS.filter(p => p.id === filter) : PRODUCTS;

  const handlePress = (id: string, url: string) => {
    if (onProductPress) onProductPress(id, url);
    else Linking.openURL(url);
  };

  const cards = products.map(p => (
    <TouchableOpacity
      key={p.id}
      style={[styles.card, layout === 'scroll' && styles.cardScroll]}
      onPress={() => handlePress(p.id, p.url)}
      activeOpacity={0.85}
    >
      {/* Card header */}
      <View style={styles.cardHeader}>
        <JobLineLogo scale={0.55} />
      </View>

      {/* Label */}
      <Text style={styles.productLabel}>{p.label}</Text>

      {/* Headline */}
      <Text style={styles.headline}>{p.headline}</Text>
      {p.accentLine && <Text style={styles.accentLine}>{p.accentLine}</Text>}

      <Text style={styles.tagline}>{p.tagline}</Text>

      {/* Bullets */}
      <View style={styles.bullets}>
        {p.bullets.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bulletCheck}>✓</Text>
            <Text style={styles.bulletText}>{b}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.cardFooter}>
        <View style={styles.qrMini}><Text style={styles.qrLabel}>QR</Text></View>
        <View style={styles.ctaRight}>
          <Text style={styles.ctaLabel}>{p.ctaLabel}</Text>
          <Text style={styles.ctaUrl}>{p.url.replace('https://', '')}</Text>
        </View>
        <View style={styles.freePill}><Text style={styles.freeText}>100% FREE</Text></View>
      </View>
    </TouchableOpacity>
  ));

  return (
    <View style={styles.wrapper}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <JobLineLogo scale={0.8} />
        <Text style={styles.sectionTitle}>BUILT FOR MANUFACTURING. BUILT FOR PEOPLE.</Text>
        <Text style={styles.sectionSub}>All programs are 100% FREE to use.</Text>
      </View>

      {layout === 'scroll' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollRow}
        >
          {cards}
        </ScrollView>
      ) : (
        <View style={styles.grid}>{cards}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.navyDeep,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadow.flyer,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.body,
    fontWeight: FontWeight.extraBold,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.sm,
  },
  sectionSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.label,
    color: Colors.subtext,
  },
  scrollRow: {
    gap: Spacing.md,
    paddingRight: Spacing.base,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.navyCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
    minHeight: 220,
    flex: 1,
    minWidth: 200,
    ...Shadow.card,
  },
  cardScroll: {
    width: 220,
  },
  cardHeader: {
    marginBottom: Spacing.xs,
  },
  productLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.semiBold,
    color: Colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headline: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.extraBold,
    color: Colors.white,
    textTransform: 'uppercase',
    lineHeight: FontSize.h3 * 1.1,
    marginBottom: 2,
  },
  accentLine: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.teal,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  tagline: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.label,
    color: Colors.subtext,
    marginBottom: Spacing.sm,
  },
  bullets: {
    flex: 1,
    gap: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletCheck: {
    color: Colors.green,
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    marginRight: 3,
  },
  bulletText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.label,
    color: Colors.whiteOff,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.navyBorder,
    paddingTop: Spacing.xs,
    gap: Spacing.xs,
  },
  qrMini: {
    width: 28, height: 28,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrLabel: { fontSize: FontSize.micro, fontWeight: FontWeight.bold, color: Colors.navyDeep },
  ctaRight: { flex: 1 },
  ctaLabel: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.green,
    textTransform: 'uppercase',
  },
  ctaUrl: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: FontSize.micro,
    color: Colors.teal,
  },
  freePill: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  freeText: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.navyDeep,
    textTransform: 'uppercase',
  },
});

export default EcosystemCard;
