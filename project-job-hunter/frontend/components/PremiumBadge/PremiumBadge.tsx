// Premium Badge component — no emojis
import { COLORS, SPACING } from '@constants/theme';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface PremiumBadgeProps {
  tier?: 'BASIC' | 'PRO' | 'ENTERPRISE';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const TIER_CONFIG = {
  BASIC: { label: 'Verified', color: '#6366F1' },
  PRO: { label: 'Premium', color: '#F59E0B' },
  ENTERPRISE: { label: 'Enterprise', color: '#10B981' },
};

const PremiumBadge: React.FC<PremiumBadgeProps> = ({ tier = 'PRO', size = 'small', style }) => {
  const config = TIER_CONFIG[tier];
  const fontSize = size === 'small' ? 10 : size === 'medium' ? 12 : 14;
  const paddingH = size === 'small' ? SPACING.sm : size === 'medium' ? SPACING.md : SPACING.lg;
  const paddingV = size === 'small' ? 2 : size === 'medium' ? 4 : 6;

  return (
    <View style={[styles.badge, { backgroundColor: config.color + '20', borderColor: config.color, paddingHorizontal: paddingH, paddingVertical: paddingV }, style]}>
      <Text style={[styles.text, { color: config.color, fontSize }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  text: { fontWeight: '700' },
});

export default PremiumBadge;
