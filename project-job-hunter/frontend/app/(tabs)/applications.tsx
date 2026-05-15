// Applications Tab — Track job applications
import { LoadingSpinner } from '@components/index';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants/theme';
import { jobService } from '@services/jobService';
import { Resume, ResumeStatus } from '@/types/job.types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const STATUS_CONFIG: Record<ResumeStatus, { label: string; color: string; symbol: string }> = {
  PENDING: { label: 'Đã gửi', color: '#F59E0B', symbol: '○' },
  REVIEWING: { label: 'Đang xem xét', color: '#3B82F6', symbol: '◎' },
  APPROVED: { label: 'Được chấp nhận', color: '#10B981', symbol: '●' },
  REJECTED: { label: 'Bị từ chối', color: '#EF4444', symbol: '✕' },
};

export default function ApplicationsTab() {
  const router = useRouter();
  const [applications, setApplications] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ResumeStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await jobService.getApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'ALL'
    ? applications
    : applications.filter(a => a.status === filter);

  if (loading) {
    return <LoadingSpinner fullScreen message="Đang tải đơn ứng tuyển..." />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn ứng tuyển</Text>
        <Text style={styles.headerSubtitle}>
          {applications.length} đơn đã nộp
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {(['ALL', 'PENDING', 'REVIEWING', 'APPROVED', 'REJECTED'] as const).map(status => {
          const count = status === 'ALL'
            ? applications.length
            : applications.filter(a => a.status === status).length;
          const config = status === 'ALL'
            ? { label: 'Tất cả', color: COLORS.primary, symbol: '≡' }
            : STATUS_CONFIG[status];

          return (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, filter === status && { backgroundColor: config.color + '20', borderColor: config.color }]}
              onPress={() => setFilter(status as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterSymbol, { color: config.color }]}>{config.symbol}</Text>
              <Text style={[styles.filterCount, { color: config.color }]}>{count}</Text>
              <Text style={styles.filterLabel}>{config.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Application Cards */}
      <View style={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIconText}>0</Text>
            </View>
            <Text style={styles.emptyText}>Chưa có đơn ứng tuyển nào</Text>
          </View>
        ) : (
          filtered.map(app => {
            const config = STATUS_CONFIG[app.status];
            return (
              <TouchableOpacity
                key={app.id}
                style={styles.appCard}
                onPress={() => app.job && router.push(`/detail?jobId=${app.job.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.appHeader}>
                  <View style={styles.appInfo}>
                    <Text style={styles.appJobName} numberOfLines={1}>
                      {app.job?.name || 'Vị trí ứng tuyển'}
                    </Text>
                    <Text style={styles.appCompany}>
                      {app.companyName || 'Công ty'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                    <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                  </View>
                </View>

                {/* Timeline */}
                <View style={styles.timeline}>
                  <View style={[styles.timelineDot, { backgroundColor: config.color }]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineText}>
                      Nộp ngày {app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.secondary },
  header: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: SPACING.lg,
    paddingTop: 50,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.white, marginBottom: 4 },
  headerSubtitle: { ...TYPOGRAPHY.body2, color: COLORS.white, opacity: 0.9 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: 6,
  },
  filterChip: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterSymbol: { fontSize: 14, fontWeight: '700' },
  filterCount: { fontSize: 18, fontWeight: '800', marginVertical: 2 },
  filterLabel: { fontSize: 9, color: COLORS.text.secondary, fontWeight: '500' },
  list: { padding: SPACING.lg },
  appCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  appInfo: { flex: 1, marginRight: SPACING.sm },
  appJobName: { ...TYPOGRAPHY.body1, fontWeight: '600', color: COLORS.text.primary },
  appCompany: { ...TYPOGRAPHY.caption, color: COLORS.text.secondary, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  timeline: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginRight: SPACING.sm },
  timelineContent: { flex: 1 },
  timelineText: { ...TYPOGRAPHY.caption, color: COLORS.text.light },
  empty: { alignItems: 'center', padding: SPACING.xxxl },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyIconText: { fontSize: 24, fontWeight: '700', color: COLORS.text.light },
  emptyText: { ...TYPOGRAPHY.body2, color: COLORS.text.secondary },
});
