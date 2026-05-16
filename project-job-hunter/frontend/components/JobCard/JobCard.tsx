// Refactored JobCard component - No inline styles
import { Job } from '@/types/job.types';
import { COLORS, SHADOW } from '@constants/theme';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MatchScore from '../MatchScore/MatchScore';

interface JobCardProps {
  job: Job;
  onPress: () => void;
  onSavePress?: () => void;
  showMatchScore?: boolean;
  style?: ViewStyle;
}

const formatSalary = (salary: number): string => {
  if (salary === 0) return 'Thoả thuận';
  if (salary >= 1000000) return (salary / 1000000).toFixed(0) + ' triệu';
  return new Intl.NumberFormat('vi-VN').format(salary);
};

import { LinearGradient } from 'expo-linear-gradient';

import { API_CONFIG } from '@/constants/endpoints';

const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  onPress, 
  onSavePress, 
  showMatchScore = false,
  style 
}) => {
  const isPremium = job.isPremium;

  const getLogoUri = () => {
    const logo = job.company?.logo;
    if (!logo) return null;
    if (logo.startsWith('http')) return logo;
    return `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}/files/download?fileName=${logo}`;
  };

  const CardContent = (
    <View style={styles.contentWrapper}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          {getLogoUri() ? (
            <Image source={{ uri: getLogoUri()! }} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoLetter}>
                {job.company?.name?.charAt(0) || 'C'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.jobInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.jobTitle} numberOfLines={1}>{job.name}</Text>
            {isPremium && (
              <View style={styles.vipBadge}>
                <Text style={styles.vipText}>VIP</Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          </View>
          <Text style={styles.companyName} numberOfLines={1}>{job.company?.name || 'Công ty ẩn danh'}</Text>
        </View>

        {showMatchScore && job.matchScore !== undefined && (
          <MatchScore score={job.matchScore} size={32} showLabel={false} />
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.tagsContainer}>
          <View style={isPremium ? styles.premiumSalaryTag : styles.salaryTag}>
            <Text style={isPremium ? styles.premiumSalaryText : styles.salaryText}>
              {formatSalary(job.salary)}
            </Text>
          </View>
          <View style={styles.locationTag}>
            <Text style={styles.locationText}>{job.location}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={onSavePress}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name={job.isSaved ? "heart" : "heart-outline"} 
            size={22} 
            color={job.isSaved ? COLORS.error : (isPremium ? '#B45309' : COLORS.gray[400])} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isPremium) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[styles.premiumOuter, style]}
      >
        <LinearGradient
          colors={['#FDE047', '#F59E0B', '#B45309']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumGradient}
        >
          <View style={styles.premiumInner}>
            {CardContent}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {CardContent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...SHADOW.sm,
  },
  premiumOuter: {
    marginBottom: 12,
    ...SHADOW.md,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.3,
  },
  premiumGradient: {
    borderRadius: 14,
    padding: 1.5, // Border width
  },
  premiumInner: {
    backgroundColor: '#FFFBEB', // Light gold background
    borderRadius: 13,
    padding: 11,
  },
  contentWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logoContainer: {
    marginRight: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
  },
  logoLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  jobInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
    lineHeight: 22,
    flexShrink: 1,
  },
  vipBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vipText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '900',
  },
  verifiedBadge: {
    backgroundColor: COLORS.primary,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  salaryTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  premiumSalaryTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#F59E0B',
  },
  salaryText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  premiumSalaryText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
  locationTag: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  locationText: {
    color: COLORS.text.secondary,
    fontSize: 12,
  },
  saveButton: {
    padding: 6,
  },
});

export default JobCard;
