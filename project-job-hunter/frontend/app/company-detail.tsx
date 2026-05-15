// Company Detail Screen
import { JobCard, LoadingSpinner, PremiumBadge } from '@components/index';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants/theme';
import { companyService } from '@services/companyService';
import { Company, Job } from '@/types/job.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CompanyDetailScreen() {
  const router = useRouter();
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (companyId) loadData(); }, [companyId]);

  const loadData = async () => {
    try {
      const id = parseInt(companyId as string, 10);
      const [companyData, jobsData] = await Promise.all([
        companyService.getCompanyDetail(id),
        companyService.getCompanyJobs(id),
      ]);
      setCompany(companyData);
      setJobs(jobsData);
    } catch (error) {
      console.error('Error loading company detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !company) return <LoadingSpinner fullScreen message="Đang tải..." />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Cover */}
      <View style={styles.cover}>
        <View style={styles.coverGradient} />
      </View>

      <View style={styles.header}>
        <View style={styles.logoWrapper}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>{company.name?.charAt(0) || 'C'}</Text>
          </View>
        </View>

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{company.name}</Text>
            {company.isPremium && <PremiumBadge tier={company.premiumTier} size="small" />}
          </View>
          <Text style={styles.industry}>{company.industry || 'IT / Phần mềm'}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <View style={[styles.metaDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.meta}>{company.address?.split(',')[0] || ''}</Text>
            </View>
            <View style={styles.metaItem}>
              <View style={[styles.metaDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.meta}>{company.size}</Text>
            </View>
            {company.website && (
              <View style={styles.metaItem}>
                <View style={[styles.metaDot, { backgroundColor: COLORS.gold }]} />
                <Text style={styles.meta}>Website</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giới thiệu công ty</Text>
        <Text style={styles.description}>{company.description}</Text>
      </View>

      {/* Opening Jobs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tuyển dụng ({jobs.length})</Text>
        {jobs.length === 0 ? (
          <Text style={styles.emptyText}>Hiện chưa có tin tuyển dụng nào.</Text>
        ) : (
          jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => router.push(`/detail?jobId=${job.id}`)}
            />
          ))
        )}
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.secondary },
  cover: { height: 120, backgroundColor: COLORS.primary },
  coverGradient: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg, backgroundColor: COLORS.white },
  logoWrapper: { marginTop: -40, marginBottom: SPACING.sm },
  logoContainer: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: COLORS.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  logo: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  info: {},
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  name: { ...TYPOGRAPHY.h2, color: COLORS.text.primary },
  industry: { ...TYPOGRAPHY.body2, color: COLORS.text.secondary, marginBottom: SPACING.sm },
  metaRow: { flexDirection: 'row', gap: SPACING.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  meta: { ...TYPOGRAPHY.caption, color: COLORS.text.light },
  section: { marginTop: SPACING.md, padding: SPACING.lg, backgroundColor: COLORS.white },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.text.primary, marginBottom: SPACING.md },
  description: { ...TYPOGRAPHY.body2, color: COLORS.text.secondary, lineHeight: 24 },
  emptyText: { ...TYPOGRAPHY.body2, color: COLORS.text.light, fontStyle: 'italic' },
});
