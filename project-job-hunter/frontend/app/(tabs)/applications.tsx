// Applications Tab — Track job applications
import { JobCard, LoadingSpinner } from '@components/index';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants/theme';
import { jobService } from '@services/jobService';
import { Job, Resume, ResumeStatus } from '@/types/job.types';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useAuthStore } from '@store/authStore';

const STATUS_CONFIG: Record<ResumeStatus, { label: string; color: string; symbol: string }> = {
  PENDING: { label: 'Đã gửi', color: '#F59E0B', symbol: '○' },
  REVIEWING: { label: 'Đang xem xét', color: '#3B82F6', symbol: '◎' },
  APPROVED: { label: 'Được chấp nhận', color: '#10B981', symbol: '●' },
  REJECTED: { label: 'Bị từ chối', color: '#EF4444', symbol: '✕' },
};

export default function ApplicationsTab() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [applications, setApplications] = useState<Resume[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'APPLIED' | 'SAVED'>('APPLIED');
  const [filter, setFilter] = useState<ResumeStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appData, savedData] = await Promise.all([
        jobService.getApplications(),
        jobService.getSavedJobs()
      ]);
      setApplications(appData);
      setSavedJobs(savedData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async (job: Job) => {
    if (!isAuthenticated) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để lưu công việc này.');
      return;
    }
    try {
      await jobService.saveJob(job.id);
      loadData(); // Refresh both
    } catch (error: any) {
      console.error('Error toggling save:', error);
      Alert.alert('Lỗi', error.message || 'Không thể lưu công việc lúc này.');
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
        <Text style={styles.headerTitle}>Việc làm của tôi</Text>
        <View style={styles.tabSwitcher}>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'APPLIED' && styles.tabItemActive]}
            onPress={() => setActiveTab('APPLIED')}
          >
            <Text style={[styles.tabText, activeTab === 'APPLIED' && styles.tabTextActive]}>Đã nộp ({applications.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'SAVED' && styles.tabItemActive]}
            onPress={() => setActiveTab('SAVED')}
          >
            <Text style={[styles.tabText, activeTab === 'SAVED' && styles.tabTextActive]}>Đã lưu ({savedJobs.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'APPLIED' ? (
        <>
          {/* Stats Filters (only for Applied) */}
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
                  <Ionicons name="document-text-outline" size={32} color={COLORS.text.light} />
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
                      <Ionicons name="calendar-outline" size={14} color={COLORS.text.light} style={{ marginRight: 6 }} />
                      <Text style={styles.timelineText}>
                        Nộp ngày {app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </>
      ) : (
        <View style={styles.list}>
          {savedJobs.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="heart-outline" size={32} color={COLORS.text.light} />
              </View>
              <Text style={styles.emptyText}>Bạn chưa lưu việc làm nào</Text>
            </View>
          ) : (
            savedJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => router.push(`/detail?jobId=${job.id}`)}
                onSavePress={() => handleToggleSave(job)}
                style={{ marginBottom: 12 }}
              />
            ))
          )}
        </View>
      )}

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
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.white, marginBottom: 16 },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  tabTextActive: {
    color: '#7C3AED',
  },
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
  emptyText: { ...TYPOGRAPHY.body2, color: COLORS.text.secondary },
});
