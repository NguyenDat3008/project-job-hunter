import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { resumeService } from '@/services/resumeService';
import { Resume, ResumeStatus } from '@/types/index';
import { COLORS } from '@/constants/theme';
import { SPACING } from '@/constants/theme';

export default function HRResumeApproval() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const data = await resumeService.getResumes(1, 100);
      setResumes(data.result);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách ứng tuyển');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleUpdateStatus = async (id: number, status: ResumeStatus) => {
    try {
      await resumeService.updateStatus(id, status);
      Alert.alert('Thành công', `Đã chuyển trạng thái sang: ${status}`);
      loadResumes();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const openCV = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert('Lỗi', 'Không thể mở CV'));
    }
  };

  const getStatusColor = (status: ResumeStatus) => {
    switch (status) {
      case ResumeStatus.APPROVED: return '#DEF7EC';
      case ResumeStatus.REJECTED: return '#FDE8E8';
      case ResumeStatus.REVIEWING: return '#E1EFFE';
      default: return '#F3F4F6';
    }
  };

  const renderItem = ({ item }: { item: Resume }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.userName}>{item.user?.name || 'Ứng viên ẩn danh'}</Text>
        <TouchableOpacity onPress={() => openCV(item.url)}>
          <Text style={styles.viewLink}>Xem CV</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.jobName}>Vị trí: {item.job?.name}</Text>
      <Text style={styles.email}>Email: {item.email}</Text>

      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#3F83F8' }]}
          onPress={() => handleUpdateStatus(item.id!, ResumeStatus.REVIEWING)}
        >
          <Text style={styles.actionText}>Xem xét</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#057A55' }]}
          onPress={() => handleUpdateStatus(item.id!, ResumeStatus.APPROVED)}
        >
          <Text style={styles.actionText}>Duyệt</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#C81E1E' }]}
          onPress={() => handleUpdateStatus(item.id!, ResumeStatus.REJECTED)}
        >
          <Text style={styles.actionText}>Từ chối</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Quản lý Ứng tuyển', headerShadowVisible: false }} />
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={resumes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có ai nộp đơn</Text>}
          onRefresh={loadResumes}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  list: { padding: SPACING.md },
  card: {
    backgroundColor: '#FFF',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    elevation: 1,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  viewLink: { color: COLORS.primary, fontWeight: '600', textDecorationLine: 'underline' },
  jobName: { fontSize: 14, color: '#4B5563', marginBottom: 4 },
  email: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 16 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 50, color: '#6B7280' }
});
