// Refactored JobCard component - No inline styles
import { Job } from '@/types/job.types';
import { COLORS, SHADOW } from '@constants/theme';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
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

const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  onPress, 
  onSavePress, 
  showMatchScore = false,
  style 
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          {job.company.logo ? (
            <Image source={{ uri: job.company.logo }} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoLetter}>
                {job.company.name?.charAt(0) || 'C'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.jobInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.jobTitle} numberOfLines={1}>{job.name}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          </View>
          <Text style={styles.companyName} numberOfLines={1}>{job.company.name}</Text>
        </View>

        {showMatchScore && job.matchScore !== undefined && (
          <MatchScore score={job.matchScore} size={32} showLabel={false} />
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.tagsContainer}>
          <View style={styles.salaryTag}>
            <Text style={styles.salaryText}>{formatSalary(job.salary)}</Text>
          </View>
          <View style={styles.locationTag}>
            <Text style={styles.locationText}>{job.location}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={onSavePress}
          activeOpacity={0.6}
        >
          <Text style={[styles.saveIcon, job.isSaved && styles.savedIcon]}>
            {job.isSaved ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...SHADOW.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logoContainer: {
    marginRight: 10,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
  },
  logoLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  jobInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    lineHeight: 20,
    flexShrink: 1,
  },
  verifiedBadge: {
    backgroundColor: COLORS.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 11,
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  salaryTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  salaryText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  locationTag: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  locationText: {
    color: COLORS.text.secondary,
    fontSize: 11,
  },
  saveButton: {
    padding: 4,
  },
  saveIcon: {
    fontSize: 18,
    color: COLORS.gray[400],
  },
  savedIcon: {
    color: COLORS.error,
  },
});

export default JobCard;
