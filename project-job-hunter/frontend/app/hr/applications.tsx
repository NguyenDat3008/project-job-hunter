import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import api from '@services/api';
import { ENDPOINTS, API_CONFIG } from '@constants/endpoints';
import { Resume, ResumeStatus } from '@/types/resume.types';
import { LoadingSpinner } from '@components/index';

const STATUS_CONFIG: Record<ResumeStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Chờ duyệt', color: '#F59E0B', bg: '#FEF3C7' },
  REVIEWING: { label: 'Đang xem xét', color: '#3B82F6', bg: '#DBEAFE' },
  APPROVED: { label: 'Chấp nhận', color: '#10B981', bg: '#D1FAE5' },
  REJECTED: { label: 'Từ chối', color: '#EF4444', bg: '#FEE2E2' },
};

export default function ApplicationsScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      let url = ENDPOINTS.RESUMES.LIST;
      if (jobId) {
        url += `?filter=job.id:'${jobId}'&size=50&sort=createdAt,desc`;
      } else {
        url += `?size=50&sort=createdAt,desc`;
      }
      
      const data = await api.get<any>(url);
      const result = Array.isArray(data) ? data : data?.result || [];
      setResumes(result);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách ứng viên.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jobId]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleUpdateStatus = async (resume: Resume, newStatus: ResumeStatus) => {
    try {
      await api.put(ENDPOINTS.RESUMES.UPDATE, {
        id: resume.id,
        status: newStatus,
      });
      
      // Update local state
      setResumes(prev => 
        prev.map(r => r.id === resume.id ? { ...r, status: newStatus } : r)
      );
      
      Alert.alert('Thành công', `Đã cập nhật trạng thái hồ sơ sang ${STATUS_CONFIG[newStatus].label}.`);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật trạng thái.');
    }
  };

  const openCV = (url: string) => {
    if (!url) {
      Alert.alert('Lỗi', 'Hồ sơ không có file CV.');
      return;
    }

    // Construct full URL if it's just a filename
    let fullUrl = url;
    if (!url.startsWith('http')) {
      fullUrl = `${API_CONFIG.BASE_URL}/files/download?fileName=${url}`;
    }

    console.log('>>> Opening CV:', fullUrl);
    Linking.openURL(fullUrl).catch(() => {
      Alert.alert('Lỗi', 'Không thể mở file CV. Vui lòng kiểm tra lại đường dẫn.');
    });
  };

  const renderItem = ({ item }: { item: Resume }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{item.user.name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.jobInfo}>
          <Ionicons name="briefcase-outline" size={14} color={COLORS.text.secondary} />
          <Text style={styles.jobName} numberOfLines={1}>Ứng tuyển: {item.job.name}</Text>
        </View>

        <Text style={styles.dateText}>
          Nộp ngày: {new Date(item.createdAt).toLocaleDateString('vi-VN')} lúc {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.cvBtn} 
            onPress={() => openCV(item.url)}
          >
            <Ionicons name="document-text-outline" size={18} color={COLORS.white} />
            <Text style={styles.cvBtnText}>Xem CV</Text>
          </TouchableOpacity>

          <View style={styles.statusActions}>
            {item.status === 'PENDING' && (
              <TouchableOpacity 
                style={[styles.miniActionBtn, { backgroundColor: '#DBEAFE' }]}
                onPress={() => handleUpdateStatus(item, 'REVIEWING')}
              >
                <Text style={[styles.miniActionText, { color: '#2563EB' }]}>Xem xét</Text>
              </TouchableOpacity>
            )}
            
            {(item.status === 'PENDING' || item.status === 'REVIEWING') && (
              <>
                <TouchableOpacity 
                  style={[styles.miniActionBtn, { backgroundColor: '#D1FAE5' }]}
                  onPress={() => handleUpdateStatus(item, 'APPROVED')}
                >
                  <Text style={[styles.miniActionText, { color: '#059669' }]}>Duyệt</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.miniActionBtn, { backgroundColor: '#FEE2E2' }]}
                  onPress={() => handleUpdateStatus(item, 'REJECTED')}
                >
                  <Text style={[styles.miniActionText, { color: '#DC2626' }]}>Từ chối</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: jobId ? 'Ứng viên theo tin' : 'Tất cả ứng viên',
          headerShadowVisible: false,
        }}
      />

      <FlatList
        data={resumes}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchApplications(); }}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>Chưa có ứng viên</Text>
            <Text style={styles.emptyText}>Khi có người nộp CV, thông tin sẽ hiển thị tại đây.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.secondary },
  list: { padding: SPACING.md },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  jobInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background.secondary,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  jobName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    flex: 1,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.light,
    marginBottom: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: SPACING.md,
  },
  cvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cvBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 6,
  },
  miniActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  miniActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginTop: 16,
  },
  emptyText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
