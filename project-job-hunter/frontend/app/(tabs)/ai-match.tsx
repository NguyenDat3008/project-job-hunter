// AI Match Tab — AI-powered job recommendations
import { JobCard, LoadingSpinner, MatchScore, SkillTag } from '@components/index';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants/theme';
import { recommendationService } from '@services/recommendationService';
import { jobService } from '@services/jobService';
import { Job } from '@/types/job.types';
import { useAuth } from '@hooks/index';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MatchResult {
  job: any;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

export default function AIMatchTab() {
  const router = useRouter();
  const { state } = useAuth();
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state?.isAuthenticated) {
      loadRecommendations();
    } else {
      setLoading(false);
    }
  }, [state?.isAuthenticated]);

  const loadRecommendations = async () => {
    try {
      const data = await recommendationService.getRecommendedJobs();
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async (job: Job) => {
    try {
      await jobService.saveJob(job.id);
      setResults(prev => prev.map(r => 
        r.job.id === job.id ? { ...r, job: { ...r.job, isSaved: !r.job.isSaved } } : r
      ));
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="AI đang phân tích..." />;
  }

  if (!state?.isAuthenticated) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="sparkles-outline" size={80} color={COLORS.gray[300]} />
        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16, color: COLORS.text.primary }}>Tính năng dành cho thành viên</Text>
        <Text style={{ fontSize: 13, color: COLORS.text.secondary, textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
          Bạn cần đăng nhập để AI có thể phân tích mức độ phù hợp công việc dựa trên hồ sơ của bạn.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 }}
          onPress={() => router.push('/login')}
        >
          <Text style={{ color: COLORS.white, fontWeight: '700' }}>Đăng nhập ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>AI</Text>
        </View>
        <Text style={styles.headerTitle}>AI Job Matching</Text>
        <Text style={styles.headerSubtitle}>
          Dựa trên kỹ năng và kinh nghiệm của bạn
        </Text>
      </View>

      {/* User Skills */}
      <View style={styles.skillsSection}>
        <Text style={styles.sectionLabel}>Kỹ năng của bạn</Text>
        <View style={styles.skillsRow}>
          {(state?.user?.skills || []).map((skill, idx) => (
            <SkillTag key={idx} name={skill} selected />
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{results.length}</Text>
          <Text style={styles.statLabel}>Việc phù hợp</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {results.filter(r => r.matchScore >= 80).length}
          </Text>
          <Text style={styles.statLabel}>Match cao</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {Math.round(results.reduce((sum, r) => sum + r.matchScore, 0) / Math.max(results.length, 1))}%
          </Text>
          <Text style={styles.statLabel}>TB Match</Text>
        </View>
      </View>

      {/* Job Results */}
      <View style={styles.resultsSection}>
        <Text style={styles.sectionLabel}>Kết quả phân tích ({results.length} việc)</Text>

        {results.map((result, idx) => (
          <View key={result.job.id} style={styles.resultCard}>
            {/* Rank */}
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{idx + 1}</Text>
            </View>

            {/* Job Card */}
            <JobCard
              job={result.job}
              onPress={() => router.push(`/detail?jobId=${result.job.id}`)}
              onSavePress={() => handleToggleSave(result.job)}
              showMatchScore
            />

            {/* Match Details */}
            <View style={styles.matchDetails}>
              {/* Matched Skills */}
              {result.matchedSkills.length > 0 && (
                <View style={styles.matchRow}>
                  <Text style={styles.matchLabel}>Skills phù hợp:</Text>
                  <View style={styles.skillsRow}>
                    {result.matchedSkills.map((s, i) => (
                      <SkillTag key={i} name={s} matched />
                    ))}
                  </View>
                </View>
              )}

              {/* Missing Skills */}
              {result.missingSkills.length > 0 && (
                <View style={styles.matchRow}>
                  <Text style={styles.matchLabel}>Cần bổ sung:</Text>
                  <View style={styles.skillsRow}>
                    {result.missingSkills.map((s, i) => (
                      <SkillTag key={i} name={s} />
                    ))}
                  </View>
                </View>
              )}

              {/* Reasons */}
              {result.reasons.length > 0 && (
                <View style={styles.reasonsRow}>
                  {result.reasons.map((r, i) => (
                    <Text key={i} style={styles.reasonText}>• {r}</Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: SPACING.lg,
    paddingTop: 50,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'flex-start',
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  headerBadgeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.white,
    opacity: 0.9,
  },
  skillsSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    marginTop: SPACING.md,
    marginHorizontal: SPACING.md,
    borderRadius: 16,
  },
  sectionLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statNumber: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  resultsSection: {
    padding: SPACING.lg,
  },
  resultCard: {
    marginBottom: SPACING.md,
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: '#7C3AED',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  rankText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  matchDetails: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: -SPACING.sm,
    marginHorizontal: SPACING.xs,
  },
  matchRow: {
    marginBottom: SPACING.sm,
  },
  matchLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  reasonsRow: {
    marginTop: 4,
  },
  reasonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
});
