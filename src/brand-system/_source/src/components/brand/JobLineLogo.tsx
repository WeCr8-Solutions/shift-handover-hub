/**
 * JobLine.ai — JobLineLogo Component
 * Renders the full text logo: ■■■◀ JobLine.ai
 *
 * Extracted from all collateral — logo always appears:
 *   - Top-left of every flyer/card
 *   - Dark background (navy) with white "JobLine" + teal ".ai"
 *   - Logomark: 3 dark squares + 1 teal right-pointing chevron/play
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontWeight, LetterSpacing } from '../../tokens';
import type { LogoProps } from '../../types/brand.types';

export const JobLineLogo: React.FC<LogoProps> = ({
  scale = 1,
  variant = 'default',
  showMark = true,
}) => {
  const fontSize = 18 * scale;
  const markSize = fontSize * 0.55;

  const textColor =
    variant === 'teal' ? Colors.teal :
    variant === 'white' ? Colors.white :
    variant === 'dark'  ? Colors.navyDeep :
    Colors.white;

  return (
    <View style={styles.container}>
      {showMark && (
        <View style={[styles.markRow, { marginRight: 6 * scale }]}>
          {/* Three dark squares */}
          <View style={[
            styles.square,
            {
              width: markSize,
              height: markSize,
              marginRight: 2 * scale,
              backgroundColor: variant === 'dark' ? Colors.navyDeep : Colors.navyMid,
              borderWidth: 1,
              borderColor: Colors.navyBorder,
            }
          ]} />
          <View style={[
            styles.square,
            {
              width: markSize,
              height: markSize,
              marginRight: 2 * scale,
              backgroundColor: variant === 'dark' ? Colors.navyDeep : Colors.navyMid,
              borderWidth: 1,
              borderColor: Colors.navyBorder,
            }
          ]} />
          <View style={[
            styles.square,
            {
              width: markSize,
              height: markSize,
              marginRight: 3 * scale,
              backgroundColor: variant === 'dark' ? Colors.navyDeep : Colors.navyMid,
              borderWidth: 1,
              borderColor: Colors.navyBorder,
            }
          ]} />
          {/* Teal chevron / play mark */}
          <Text style={[
            styles.chevron,
            {
              fontSize: markSize * 1.2,
              color: Colors.teal,
              lineHeight: markSize * 1.4,
            }
          ]}>▶</Text>
        </View>
      )}

      <Text style={[
        styles.logoText,
        {
          fontSize,
          color: textColor,
          letterSpacing: LetterSpacing.tight,
        }
      ]}>
        JobLine
        <Text style={{ color: Colors.teal }}>.ai</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  square: {
    borderRadius: 1,
  },
  chevron: {
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
  },
  logoText: {
    fontFamily: FontFamily.displayBold,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
  },
});

export default JobLineLogo;
