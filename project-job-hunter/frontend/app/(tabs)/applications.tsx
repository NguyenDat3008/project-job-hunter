// Applications Tab — Premium UI for tracking job applications
import { JobCard, LoadingSpinner } from '@components/index';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants/theme';
import { jobService } from '@services/jobService';
import { Job, Resume, ResumeStatus } from '@/types/job.types';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Alert, 
  RefreshControl,
  Dimensions,
  Platform
} from 'react-native';
import { useAuthStore } from '@store/authStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const STATUS_CONFIG: Record<ResumeStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  PENDING: { label: 'Đã gửi', color: '#F59E0B', bgColor: '#FFFBEB', icon: 'send-outline' },
  REVIEWING: { label: 'Đang xem xét', color: '#3B82F6', bgColor: '#EFF6FF', icon: 'eye-outline' },
  APPROVED: { label: 'Chấp nhận', color: '#10B981', bgColor: '#ECFDF5', icon: 'checkmark-circle-outline' },
  REJECTED: { label: 'Từ chối', color: '#EF4444', bgColor: '#FEF2F2', icon: 'close-circle-outline' },
};

export default function ApplicationsTab() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [applications, setApplications] = useState<Resume[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'APPLIED' | 'SAVED'>('APPLIED');
  const [filter, setFilter] = useState<ResumeStatus | 'ALL'>('ALL');

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    try {
      const [appData, savedData] = await Promise.all([
        jobService.getApplications(),
        jobService.getSavedJobs()
      ]);
      setApplications(appData || []);
      setSavedJobs(savedData || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleToggleSave = async (job: Job) => {
    if (!isAuthenticated) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để lưu công việc này.');
      return;
    }
    try {
      await jobService.saveJob(job.id);
      loadData(true); 
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu công việc.');
    }
  };

  const filtered = filter === 'ALL'
    ? applications
    : applications.filter(a => a.status === filter);

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Đang tải dữ liệu của bạn..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header with Luxury Gradient */}
      <LinearGradient
        colors={['#00B14F', '#009241', '#007433']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.topRow}>
            <Text style={styles.headerTitle}>Hành trình nghề nghiệp</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
               <Ionicons name="refresh" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>Theo dõi và bứt phá cùng TopCV</Text>
          
          <View style={styles.tabSwitcher}>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'APPLIED' && styles.tabItemActive]}
              onPress={() => setActiveTab('APPLIED')}
            >
              <Ionicons 
                name="document-text" 
                size={18} 
                color={activeTab === 'APPLIED' ? '#00B14F' : 'rgba(255,255,255,0.7)'} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'APPLIED' && styles.tabTextActive]}>
                Đã nộp ({applications.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'SAVED' && styles.tabItemActive]}
              onPress={() => setActiveTab('SAVED')}
            >
              <Ionicons 
                name="heart" 
                size={18} 
                color={activeTab === 'SAVED' ? '#00B14F' : 'rgba(255,255,255,0.7)'} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'SAVED' && styles.tabTextActive]}>
                Đã lưu ({savedJobs.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00B14F" />
        }
      >
        {activeTab === 'APPLIED' ? (
          <>
            {/* Horizontal Filter Pills */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.filterContainer}
              contentContainerStyle={styles.filterContent}
            >
              {(['ALL', 'PENDING', 'REVIEWING', 'APPROVED', 'REJECTED'] as const).map(status => {
                const config = status === 'ALL'
                  ? { label: 'Tất cả', color: '#00B14F', bgColor: '#F0FDF4' }
                  : STATUS_CONFIG[status];
                
                const isActive = filter === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterPill, 
                      { backgroundColor: config.bgColor },
                      isActive && { borderColor: config.color, borderWidth: 1.5, shadowOpacity: 0.1 }
                    ]}
                    onPress={() => setFilter(status as ResumeStatus | 'ALL')}
                  >
                    <Text style={[styles.filterPillText, { color: config.color }]}>{config.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* List of Applications */}
            <View style={styles.list}>
              {filtered.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIllustration}>
                    <Ionicons name="briefcase-outline" size={80} color="#E5E7EB" />
                  </View>
                  <Text style={styles.emptyTitle}>Chưa có hồ sơ ứng tuyển</Text>
                  <Text style={styles.emptyDesc}>Bắt đầu nộp đơn ngay để không bỏ lỡ các cơ hội việc làm hấp dẫn nhất.</Text>
                  <TouchableOpacity 
                    style={styles.exploreBtn}
                    onPress={() => router.push('/(tabs)')}
                  >
                    <Text style={styles.exploreBtnText}>Tìm việc ngay</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filtered.map(app => {
                  const config = STATUS_CONFIG[app.status];
                  return (
                    <TouchableOpacity
                      key={app.id}
                      style={styles.card}
                      onPress={() => app.job && router.push(`/detail?jobId=${app.job.id}`)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.cardInfo}>
                          <Text style={styles.jobTitle} numberOfLines={1}>{app.job?.name}</Text>
                          <Text style={styles.companyName}>{app.companyName || 'Công ty đăng tuyển'}</Text>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: config.bgColor }]}>
                          <Ionicons name={config.icon as any} size={14} color={config.color} style={{ marginRight: 4 }} />
                          <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
                        </View>
                      </View>

                      <View style={styles.cardFooter}>
                        <View style={styles.footerItem}>
                          <Ionicons name="time-outline" size={14} color="#6B7280" />
                          <Text style={styles.footerText}>
                            Ngày nộp: {app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                          </Text>
                        </View>
                        <View style={styles.footerItem}>
                          <Text style={styles.detailLink}>Chi tiết</Text>
                          <Ionicons name="chevron-forward" size={14} color="#00B14F" />
                        </View>
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
              <View style={styles.emptyState}>
                <View style={styles.emptyIllustration}>
                  <Ionicons name="heart-dislike-outline" size={80} color="#E5E7EB" />
                </View>
                <Text style={styles.emptyTitle}>Danh sách lưu trống</Text>
                <Text style={styles.emptyDesc}>Hãy lưu lại những công việc bạn quan tâm để dễ dàng ứng tuyển sau này.</Text>
              </View>
            ) : (
              savedJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onPress={() => router.push(`/detail?jobId=${job.id}`)}
                  onSavePress={() => handleToggleSave(job)}
                  style={styles.jobCardOverride}
                />
              ))
            )}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 10,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  headerContent: { paddingHorizontal: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, marginBottom: 24 },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  tabItemActive: { backgroundColor: '#FFFFFF', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  tabTextActive: { color: '#00B14F' },
  content: { flex: 1 },
  filterContainer: { marginTop: 20 },
  filterContent: { paddingHorizontal: 24, gap: 12, paddingBottom: 10 },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderColor: 'transparent',
  },
  filterPillText: { fontSize: 13, fontWeight: '700' },
  list: { padding: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, marginRight: 12 },
  jobTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', lineHeight: 22 },
  companyName: { fontSize: 14, color: '#64748B', marginTop: 4 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  statusLabel: { fontSize: 11, fontWeight: '800' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  detailLink: { fontSize: 12, color: '#00B14F', fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyIllustration: { marginBottom: 24, opacity: 0.3 },
  emptyTitle: { fontSize: 19, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  emptyDesc: { fontSize: 15, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
  exploreBtn: {
    marginTop: 30,
    backgroundColor: '#00B14F',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  exploreBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  jobCardOverride: {
    marginBottom: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    elevation: 3,
  }
});
