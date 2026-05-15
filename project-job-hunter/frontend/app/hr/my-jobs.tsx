// app/hr/my-jobs.tsx
// Danh sách việc làm đã đăng — cho HR và COMPANY_REPRESENTATIVE
// Lọc theo công ty của user hiện tại

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import api from '@services/api';
import { ENDPOINTS } from '@constants/endpoints';
import { useAuthStore } from '@store/authStore';
import { Job } from '@/types/job.types';

export default function MyJobsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const companyId = user?.company?.id;
      if (!companyId) {
        setJobs([]);
        return;
      }
      const data = await api.get<any>(
        `${ENDPOINTS.JOBS.LIST}?filter=company.id:'${companyId}'&size=50&sort=createdAt,desc`
      );
      const result = Array.isArray(data) ? data : data?.result || [];
      setJobs(result);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách việc làm.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.company?.id]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleDelete = (job: Job) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa "${job.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(ENDPOINTS.JOBS.DELETE(job.id));
              setJobs(prev => prev.filter(j => j.id !== job.id));
            } catch {
              Alert.alert('Lỗi', 'Không thể xóa tin tuyển dụng.');
            }
          },
        },
      ]
    );
  };

  const formatSalary = (salary: number) =>
    salary > 0 ? `${(salary / 1_000_000).toFixed(0)}M VND` : 'Thỏa thuận';

  const renderItem = ({ item }: { item: Job }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.jobName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Ionicons name="location-outline" size={12} color={COLORS.text.secondary} />
              <Text style={styles.tagText}>{item.location}</Text>
            </View>
            <View style={styles.tag}>
              <Ionicons name="cash-outline" size={12} color={COLORS.success} />
              <Text style={[styles.tagText, { color: COLORS.success }]}>{formatSalary(item.salary)}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: item.active ? '#DEF7EC' : '#FDE8E8' }]}>
              <Text style={{ fontSize: 11, color: item.active ? '#03543F' : '#9B1C1C', fontWeight: '600' }}>
                {item.active ? 'Đang hiển thị' : 'Ẩn'}
              </Text>
            </View>
          </View>
          {item.createdAt && (
            <Text style={styles.dateText}>
              Đăng ngày: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.primaryLight }]}
          onPress={() => router.push({ pathname: '/hr/job-form', params: { id: String(item.id) } })}
        >
          <Ionicons name="create-outline" size={16} color={COLORS.primary} />
          <Text style={[styles.actionText, { color: COLORS.primary }]}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FDE8E8' }]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          <Text style={[styles.actionText, { color: COLORS.error }]}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Việc làm đã đăng',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: COLORS.white },
          headerRight: () => (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/hr/job-form')}
            >
              <Ionicons name="add" size={22} color={COLORS.white} />
            </TouchableOpacity>
          ),
        }}
      />

      {!user?.company ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Chưa có công ty</Text>
          <Text style={styles.emptyText}>Tài khoản của bạn chưa được liên kết với công ty nào.</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchJobs(); }}
              tintColor={COLORS.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.companyName}>{user.company.name}</Text>
              <Text style={styles.jobCount}>{jobs.length} tin đang đăng</Text>
            </View>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-outline" size={64} color={COLORS.border} />
                <Text style={styles.emptyTitle}>Chưa có tin nào</Text>
                <Text style={styles.emptyText}>Nhấn nút + để đăng tin tuyển dụng đầu tiên.</Text>
                <TouchableOpacity
                  style={styles.createFirstBtn}
                  onPress={() => router.push('/hr/job-form')}
                >
                  <Text style={styles.createFirstText}>Đăng tin ngay</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.secondary },
  list: { padding: SPACING.md },

  header: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  companyName: { ...TYPOGRAPHY.h3, color: COLORS.text.primary },
  jobCount: { ...TYPOGRAPHY.caption, color: COLORS.text.secondary, marginTop: 2 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  cardTop: { marginBottom: SPACING.sm },
  jobName: { ...TYPOGRAPHY.h3, color: COLORS.text.primary, marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagText: { ...TYPOGRAPHY.caption, color: COLORS.text.secondary },
  dateText: { ...TYPOGRAPHY.caption, color: COLORS.text.light, marginTop: 4 },

  actions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: SPACING.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
  },
  actionText: { ...TYPOGRAPHY.caption, fontWeight: '700' },

  addBtn: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.text.primary, marginTop: 16, marginBottom: 8 },
  emptyText: { ...TYPOGRAPHY.body2, color: COLORS.text.secondary, textAlign: 'center' },
  createFirstBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    ...SHADOW.md,
  },
  createFirstText: { ...TYPOGRAPHY.body1, fontWeight: '700', color: COLORS.white },
});
