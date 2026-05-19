import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@services/api';
import { Resume } from '@/types/index';
import { COLORS, SPACING, SHADOW, BORDER_RADIUS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

type TabType = 'REPORTED' | 'ALL';

export default function AdminResumesScreen() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('REPORTED');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchResumes = useCallback(async () => {
    try {
      const response = await api.get<any>('/resumes?page=1&size=100');
      const result = response?.result || response?.data?.result || [];
      setResumes(result);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách hồ sơ ứng tuyển');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResumes();
  };

  const handleWarn = async (id: number, userName: string, currentWarnings: number = 0) => {
    Alert.alert(
      'Cảnh cáo ứng viên',
      `Bạn có chắc chắn muốn cảnh cáo ứng viên ${userName}? \n(Hiện tại có ${currentWarnings} cảnh cáo. Đủ 2 cảnh cáo sẽ tự động khóa tài khoản)`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận cảnh cáo',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              await api.put(`/resumes/${id}/warn`);
              Alert.alert('Thành công', `Đã gửi 1 cảnh cáo vi phạm tới ứng viên ${userName}.`);
              fetchResumes();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể gửi cảnh cáo');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleBan = async (id: number, userName: string) => {
    Alert.alert(
      'Khóa tài khoản vĩnh viễn',
      `Bạn có chắc chắn muốn KHÓA VĨNH VIỄN tài khoản của ứng viên ${userName}? \nHành động này không thể hoàn tác!`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Khóa tài khoản',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              await api.put(`/resumes/${id}/ban-user`);
              Alert.alert('Thành công', `Đã khóa vĩnh viễn tài khoản của ứng viên ${userName}.`);
              fetchResumes();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể khóa tài khoản');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleDismissReport = async (id: number) => {
    setActionLoadingId(id);
    try {
      await api.put(`/resumes/${id}/dismiss-report`);
      Alert.alert('Thành công', 'Đã bỏ qua báo cáo vi phạm cho CV này.');
      fetchResumes();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể bỏ qua báo cáo');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteResume = async (id: number) => {
    Alert.alert(
      'Xóa Hồ sơ',
      'Bạn có chắc chắn muốn xóa CV này khỏi hệ thống? Ứng tuyển liên quan cũng sẽ bị gỡ bỏ.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa CV',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              await api.delete(`/resumes/${id}`);
              Alert.alert('Thành công', 'Đã xóa hồ sơ ứng tuyển thành công.');
              fetchResumes();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa hồ sơ');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const openCV = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert('Lỗi', 'Không thể mở link CV'));
    } else {
      Alert.alert('Lỗi', 'CV không có link đính kèm');
    }
  };

  // Filter local resumes list based on active tab
  const reportedResumes = resumes.filter(r => r.isReported === true);
  const displayedResumes = activeTab === 'REPORTED' ? reportedResumes : resumes;

  const renderItem = ({ item }: { item: Resume }) => {
    const isItemLoading = actionLoadingId === item.id;
    const currentWarnings = item.user?.warnings || 0;

    return (
      <View style={[styles.card, item.isReported && styles.reportedCard]}>
        {item.isReported && (
          <LinearGradient
            colors={['#FEF2F2', '#FEE2E2']}
            style={styles.reportBanner}
          >
            <View style={styles.reportBannerHeader}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.reportBannerTitle}>HỒ SƠ BỊ BÁO CÁO VI PHẠM</Text>
            </View>
            <Text style={styles.reportDetail}>
              <Text style={{ fontWeight: 'bold' }}>Lý do: </Text>
              {item.reportReason || 'Không rõ lý do'}
            </Text>
            <Text style={styles.reporterInfo}>
              Người báo cáo: {item.reportedBy || 'Ẩn danh'}
            </Text>
            <View style={styles.warningContainer}>
              <Ionicons name="warning-outline" size={14} color="#D97706" />
              <Text style={styles.warningText}>
                Số cảnh cáo hiện tại của ứng viên: <Text style={{ fontWeight: 'bold', color: '#B45309' }}>{currentWarnings}</Text> / 2
              </Text>
            </View>
          </LinearGradient>
        )}

        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{item.user?.name || 'Ứng viên ẩn danh'}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <TouchableOpacity style={styles.cvBtn} onPress={() => openCV(item.url)}>
            <Ionicons name="document-attach" size={16} color="#00B14F" />
            <Text style={styles.cvBtnText}>Xem CV</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="briefcase-outline" size={14} color="#64748B" />
          <Text style={styles.metaText} numberOfLines={1}>
            Ứng tuyển: <Text style={{ fontWeight: '600' }}>{item.job?.name}</Text>
          </Text>
        </View>

        {item.companyName && (
          <View style={styles.metaRow}>
            <Ionicons name="business-outline" size={14} color="#64748B" />
            <Text style={styles.metaText} numberOfLines={1}>
              Công ty: {item.companyName}
            </Text>
          </View>
        )}

        {isItemLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 12 }} />
        ) : (
          <View style={styles.actionsContainer}>
            {item.isReported ? (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnWarn]}
                  onPress={() => handleWarn(item.id, item.user?.name || 'Ứng viên', currentWarnings)}
                >
                  <Ionicons name="warning" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.btnText}>Cảnh cáo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnBan]}
                  onPress={() => handleBan(item.id, item.user?.name || 'Ứng viên')}
                >
                  <Ionicons name="ban" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.btnText}>Khóa acc</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnDismiss]}
                  onPress={() => handleDismissReport(item.id)}
                >
                  <Ionicons name="checkmark" size={14} color="#475569" style={{ marginRight: 4 }} />
                  <Text style={[styles.btnText, { color: '#475569' }]}>Bỏ qua</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnDelete, { flex: 0, paddingHorizontal: 16 }]}
                onPress={() => handleDeleteResume(item.id)}
              >
                <Ionicons name="trash-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.btnText}>Xóa Hồ Sơ</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Xét duyệt Báo cáo CV',
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
        }}
      />

      {/* Modern Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'REPORTED' && styles.activeTab]}
          onPress={() => setActiveTab('REPORTED')}
        >
          <View style={styles.tabContent}>
            <Text style={[styles.tabText, activeTab === 'REPORTED' && styles.activeTabText]}>
              CV bị báo cáo
            </Text>
            {reportedResumes.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{reportedResumes.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'ALL' && styles.activeTab]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.activeTabText]}>
            Tất cả hồ sơ
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách hồ sơ ứng tuyển...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedResumes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'REPORTED' ? 'shield-checkmark-outline' : 'document-text-outline'}
                size={64}
                color="#CBD5E1"
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'REPORTED' ? 'Không có báo cáo nào' : 'Danh sách trống'}
              </Text>
              <Text style={styles.emptyDesc}>
                {activeTab === 'REPORTED'
                  ? 'Hiện tại không có CV nào bị báo cáo vi phạm điều khoản.'
                  : 'Hệ thống chưa có hồ sơ ứng tuyển nào được ghi nhận.'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00B14F"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  activeTab: {
    backgroundColor: '#EFF6FF',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#1E40AF',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  list: { padding: SPACING.md },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOW.sm,
  },
  reportedCard: {
    borderColor: '#FCA5A5',
    borderWidth: 1.5,
  },
  reportBanner: {
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    marginBottom: 12,
  },
  reportBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  reportBannerTitle: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 12,
  },
  reportDetail: {
    fontSize: 13,
    color: '#1E293B',
    marginBottom: 4,
  },
  reporterInfo: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  warningText: {
    fontSize: 11,
    color: '#D97706',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  cvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
  },
  cvBtnText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
  },
  btnWarn: {
    backgroundColor: '#F59E0B',
  },
  btnBan: {
    backgroundColor: '#DC2626',
  },
  btnDismiss: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnDelete: {
    backgroundColor: '#991B1B',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 32,
  },
});
