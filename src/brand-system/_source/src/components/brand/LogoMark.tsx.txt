/**
 * JobLine.ai — LogoMark Component
 * Standalone ■■■◀ icon mark — used in app icons, favicons, small spaces
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../tokens';

interface LogoMarkProps {
  size?: number;
  /** 'teal' tints all squares teal; 'default' uses navy squares + teal chevron */
  variant?: 'default' | 'teal' | 'white';
}

export const LogoMark: React.FC<LogoMarkProps> = ({
  size = 24,
  variant = 'default',
}) => {
  const squareSize = size * 0.28;
  const gap = size * 0.06;

  const squareColor =
    variant === 'teal'  ? Colors.teal :
    variant === 'white' ? Colors.white :
    Colors.navyMid;

  return (
    <View style={[styles.container, { height: size }]}>
      <View style={[styles.square, { width: squareSize, height: squareSize, backgroundColor: squareColor, marginRight: gap }]} />
      <View style={[styles.square, { width: squareSize, height: squareSize, backgroundColor: squareColor, marginRight: gap }]} />
      <View style={[styles.square, { width: squareSize, height: squareSize, backgroundColor: squareColor, marginRight: gap * 1.5 }]} />
      <Text style={[styles.chevron, { fontSize: squareSize * 1.2, color: Colors.teal }]}>▶</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  square: {
    borderRadius: 1,
  },
  chevron: {
    includeFontPadding: false,
    lineHeight: undefined,
  },
});

export default LogoMark;
