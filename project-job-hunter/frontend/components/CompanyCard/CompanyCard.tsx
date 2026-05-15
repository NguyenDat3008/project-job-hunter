// Company Card component
import { Company } from '@/types/job.types';
import { BORDER_RADIUS, COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import PremiumBadge from '../PremiumBadge/PremiumBadge';

interface CompanyCardProps {
  company: Company;
  onPress: () => void;
  style?: ViewStyle;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, onPress, style }) => {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.logoContainer, company.isPremium && styles.premiumBorder]}>
        <Text style={styles.logo}>{company.name?.charAt(0) || 'C'}</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>{company.name}</Text>
      {company.isPremium && company.premiumTier && (
        <PremiumBadge tier={company.premiumTier} size="small" style={{ marginTop: 4 }} />
      )}
      <Text style={styles.meta}>{company.jobCount || 0} việc làm</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140, backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    marginRight: SPACING.md, alignItems: 'center', ...SHADOW.sm,
  },
  logoContainer: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  premiumBorder: { borderWidth: 2, borderColor: COLORS.gold },
  logo: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  name: { ...TYPOGRAPHY.captionBold, color: COLORS.text.primary, textAlign: 'center' },
  meta: { fontSize: 11, color: COLORS.text.light, marginTop: 4 },
});

export default CompanyCard;
