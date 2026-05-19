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
  Modal,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import api from '@services/api';
import { ENDPOINTS, API_CONFIG } from '@constants/endpoints';
import { Resume, ResumeStatus } from '@/types/resume.types';
import { LoadingSpinner, LoginRequired } from '@components/index';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '@store/authStore';

const { width } = Dimensions.get('window');

const STATUS_CONFIG: Record<ResumeStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING: { label: 'Chờ duyệt', color: '#F59E0B', bg: '#FFFBEB', icon: 'time-outline' },
  REVIEWING: { label: 'Xem xét', color: '#3B82F6', bg: '#EFF6FF', icon: 'eye-outline' },
  APPROVED: { label: 'Chấp nhận', color: '#10B981', bg: '#ECFDF5', icon: 'checkmark-circle-outline' },
  REJECTED: { label: 'Từ chối', color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle-outline' },
};

export default function ApplicationsScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [refreshing, setRefreshing] = useState(false);
  
  // Status Modal State
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [targetStatus, setTargetStatus] = useState<ResumeStatus>('PENDING');
  const [statusMessage, setStatusMessage] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      let url = ENDPOINTS.RESUMES.LIST;
      if (jobId) {
        url += `?filter=job.id:'${jobId}'&size=100&sort=createdAt,desc`;
      } else {
        url += `?size=100&sort=createdAt,desc`;
      }
      
      const data = await api.get<any>(url);
      const result = Array.isArray(data) ? data : data?.result || [];
      setResumes(result);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [jobId]);

  useEffect(() => { 
    if (isAuthenticated) fetchApplications(); 
  }, [isAuthenticated, fetchApplications]);

  const openStatusModal = (resume: Resume, status: ResumeStatus) => {
    setSelectedResume(resume);
    setTargetStatus(status);
    setStatusMessage('');
    setStatusModalVisible(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedResume) return;
    setUpdating(true);
    try {
      await api.put(ENDPOINTS.RESUMES.UPDATE, {
        id: selectedResume.id,
        status: targetStatus,
        message: statusMessage,
      });
      setResumes(prev => prev.map(r => r.id === selectedResume.id ? { ...r, status: targetStatus } : r));
      setStatusModalVisible(false);
      Alert.alert('Thành công', 'Đã cập nhật trạng thái và gửi thông báo cho ứng viên.');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật trạng thái.');
    } finally {
      setUpdating(false);
    }
  };

  const openCV = (url: string) => {
    if (!url) {
      Alert.alert('Lỗi', 'Hồ sơ không có file CV.');
      return;
    }
    let fullUrl = url;
    if (!url.startsWith('http')) {
      fullUrl = `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}/files/download?fileName=${url}`;
    }
    Linking.openURL(fullUrl).catch(() => Alert.alert('Lỗi', 'Không thể mở CV.'));
  };

  const renderItem = ({ item }: { item: Resume }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.userInfo}>
            <LinearGradient colors={['#E0F2FE', '#BAE6FD']} style={styles.avatar}>
               <Text style={styles.avatarText}>{item.user.name.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{item.user.name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
               <Ionicons name={status.icon as any} size={12} color={status.color} style={{ marginRight: 4 }} />
               <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.jobBox}>
          <Ionicons name="briefcase" size={14} color="#64748B" />
          <Text style={styles.jobText} numberOfLines={1}>Tin tuyển dụng: {item.job.name}</Text>
        </View>

        <View style={styles.actions}>
           <TouchableOpacity style={styles.cvBtn} onPress={() => openCV(item.url)}>
              <Ionicons name="document-attach" size={18} color="#00B14F" />
              <Text style={styles.cvBtnText}>Xem CV</Text>
           </TouchableOpacity>

           <View style={styles.btnGroup}>
              <TouchableOpacity style={[styles.miniBtn, { backgroundColor: '#EFF6FF' }]} onPress={() => openStatusModal(item, 'REVIEWING')}>
                 <Ionicons name="eye" size={16} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.miniBtn, { backgroundColor: '#ECFDF5' }]} onPress={() => openStatusModal(item, 'APPROVED')}>
                 <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.miniBtn, { backgroundColor: '#FEF2F2' }]} onPress={() => openStatusModal(item, 'REJECTED')}>
                 <Ionicons name="close-circle" size={16} color="#EF4444" />
              </TouchableOpacity>
           </View>
        </View>
      </View>
    );
  };

  if (!isAuthenticated) return <LoginRequired message="Bạn cần đăng nhập với quyền HR để xem danh sách ứng viên" />;
  if (loading) return <LoadingSpinner fullScreen message="Đang tải danh sách hồ sơ..." />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        headerTitle: 'Quản lý ứng viên',
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
      }} />

      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.listContainer}>
        <FlatList
          data={resumes}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>Chưa có ứng viên nào ứng tuyển</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchApplications(); }} tintColor="#00B14F" />
          }
        />
      </LinearGradient>

      {/* Modern Status Modal */}
      <Modal visible={statusModalVisible} transparent animationType="slide" onRequestClose={() => setStatusModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Phản hồi ứng viên</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                 <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.statusPreview, { backgroundColor: STATUS_CONFIG[targetStatus]?.bg }]}>
               <Text style={{ color: STATUS_CONFIG[targetStatus]?.color, fontWeight: '700' }}>
                 Trạng thái mới: {STATUS_CONFIG[targetStatus]?.label}
               </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Gửi lời nhắn động viên hoặc hẹn lịch phỏng vấn..."
              multiline
              numberOfLines={4}
              value={statusMessage}
              onChangeText={setStatusMessage}
            />

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: STATUS_CONFIG[targetStatus]?.color }]} 
              onPress={handleUpdateStatus}
              disabled={updating}
            >
              <Text style={styles.submitBtnText}>{updating ? 'Đang gửi...' : 'Xác nhận cập nhật'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  listContainer: { flex: 1 },
  list: { padding: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardTop: { marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#0369A1' },
  userName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  userEmail: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '800' },
  jobBox: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  jobText: { fontSize: 12, color: '#64748B', flex: 1, fontWeight: '500' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cvBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  cvBtnText: { color: '#00B14F', fontWeight: '700', fontSize: 13 },
  btnGroup: { flexDirection: 'row', gap: 8 },
  miniBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 100 },
  emptyText: { marginTop: 12, color: '#94A3B8', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  statusPreview: { padding: 12, borderRadius: 12, marginBottom: 16 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, fontSize: 14 },
  submitBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', elevation: 4 },
  submitBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
