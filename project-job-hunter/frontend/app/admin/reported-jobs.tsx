import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@services/api';
import { Job } from '@/types/index';
import { COLORS, SPACING, SHADOW, BORDER_RADIUS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

type TabType = 'REPORTED' | 'ALL';

const parseReportReason = (reason: string) => {
  if (!reason) return { reasonText: 'Không rõ lý do', reporter: null };
  
  const parts = reason.split(' | Người báo cáo: ');
  if (parts.length < 2) {
    return { reasonText: reason, reporter: null };
  }
  
  const reasonText = parts[0];
  const reporterPart = parts[1];
  
  const nameParts = reporterPart.split(' (SĐT: ');
  const name = nameParts[0];
  
  let phone = '';
  let address = '';
  let email = '';
  
  if (nameParts.length > 1) {
    const detailsPart = nameParts[1];
    const detailsClean = detailsPart.endsWith(')') ? detailsPart.slice(0, -1) : detailsPart;
    
    const addressParts = detailsClean.split(', Địa chỉ: ');
    phone = addressParts[0];
    
    if (addressParts.length > 1) {
      const emailParts = addressParts[1].split(', Email: ');
      address = emailParts[0];
      if (emailParts.length > 1) {
        email = emailParts[1];
      }
    }
  }
  
  return {
    reasonText,
    reporter: {
      name,
      phone,
      address,
      email
    }
  };
};

export default function AdminReportedJobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('REPORTED');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await api.get<any>('/jobs?page=1&size=200');
      const result = response?.result || response?.data?.result || [];
      setJobs(result);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách tin tuyển dụng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleWarnCompany = async (id: number, jobName: string, companyName: string) => {
    Alert.alert(
      'Cảnh cáo công ty',
      `Bạn có chắc chắn muốn cảnh cáo công ty "${companyName}" vì tin "${jobName}"?\n(Đủ 2 cảnh cáo sẽ tự động vô hiệu hóa công ty)`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận cảnh cáo',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              await api.put(`/jobs/${id}/warn-company`);
              Alert.alert('Thành công', `Đã gửi cảnh cáo vi phạm tới công ty ${companyName}.`);
              fetchJobs();
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

  const handleHideJob = async (id: number, jobName: string) => {
    Alert.alert(
      'Ẩn tin tuyển dụng',
      `Bạn có chắc chắn muốn ẨN tin tuyển dụng "${jobName}" khỏi hệ thống?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Ẩn tin',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(id);
            try {
              await api.put(`/jobs/${id}/hide`);
              Alert.alert('Thành công', `Đã ẩn tin tuyển dụng "${jobName}".`);
              fetchJobs();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể ẩn tin');
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
      await api.put(`/jobs/${id}/dismiss-report`);
      Alert.alert('Thành công', 'Đã bỏ qua báo cáo vi phạm cho tin này.');
      fetchJobs();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể bỏ qua báo cáo');
    } finally {
      setActionLoadingId(null);
    }
  };

  const reportedJobs = jobs.filter(j => j.isReported === true);
  const displayedJobs = activeTab === 'REPORTED' ? reportedJobs : jobs;

  const renderItem = ({ item }: { item: Job }) => {
    const isItemLoading = actionLoadingId === item.id;
    const companyName = item.company?.name || 'Không rõ';
    const parsed = parseReportReason(item.reportReason || '');

    return (
      <TouchableOpacity
        style={[styles.card, item.isReported && styles.reportedCard]}
        onPress={() => setDetailJob(item)}
        activeOpacity={0.95}
      >
        {item.isReported && (
          <LinearGradient
            colors={['#FEF2F2', '#FEE2E2']}
            style={styles.reportBanner}
          >
            <View style={styles.reportBannerHeader}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.reportBannerTitle}>TIN TUYỂN DỤNG BỊ BÁO CÁO LỪA ĐẢO</Text>
            </View>
            <Text style={styles.reportDetail} numberOfLines={2}>
              <Text style={{ fontWeight: 'bold' }}>Lý do: </Text>
              {parsed.reasonText}
            </Text>
            <Text style={styles.reporterInfo}>
              Người báo cáo: {parsed.reporter?.name || item.reportedBy || 'Ẩn danh'}
            </Text>
          </LinearGradient>
        )}

        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobName}>{item.name}</Text>
            <View style={styles.companyRow}>
              <Ionicons name="business-outline" size={14} color="#64748B" />
              <Text style={styles.companyName} numberOfLines={1}>
                {companyName}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.active ? '#ECFDF5' : '#FEF2F2' }]}>
            <Text style={[styles.statusText, { color: item.active ? '#059669' : '#DC2626' }]}>
              {item.active ? 'Đang hiện' : 'Đã ẩn'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color="#64748B" />
          <Text style={styles.metaText}>{item.location}</Text>
          <Text style={styles.metaSep}>•</Text>
          <Ionicons name="cash-outline" size={14} color="#64748B" />
          <Text style={styles.metaText}>
            {item.salary === 0 ? 'Thoả thuận' : `${(item.salary / 1000000).toFixed(0)} triệu`}
          </Text>
        </View>

        {isItemLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 12 }} />
        ) : (
          item.isReported && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnWarn]}
                onPress={(e) => {
                  e.stopPropagation(); // Ngăn sự kiện bấm nút kích hoạt mở Modal
                  handleWarnCompany(item.id, item.name, companyName);
                }}
              >
                <Ionicons name="warning" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.btnText}>Cảnh cáo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnHide]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleHideJob(item.id, item.name);
                }}
              >
                <Ionicons name="eye-off" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.btnText}>Ẩn tin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnDismiss]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDismissReport(item.id);
                }}
              >
                <Ionicons name="checkmark" size={14} color="#475569" style={{ marginRight: 4 }} />
                <Text style={[styles.btnText, { color: '#475569' }]}>Bỏ qua</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Tin bị báo cáo',
          headerTitleStyle: { fontWeight: '800', fontSize: 16 },
          headerShadowVisible: false,
          headerTintColor: '#1E293B',
        }}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'REPORTED' && styles.activeTab]}
          onPress={() => setActiveTab('REPORTED')}
        >
          <View style={styles.tabContent}>
            <Text style={[styles.tabText, activeTab === 'REPORTED' && styles.activeTabText]}>
              Tin bị báo cáo
            </Text>
            {reportedJobs.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{reportedJobs.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'ALL' && styles.activeTab]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.activeTabText]}>
            Tất cả tin
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách tin tuyển dụng...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedJobs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'REPORTED' ? 'shield-checkmark-outline' : 'briefcase-outline'}
                size={64}
                color="#CBD5E1"
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'REPORTED' ? 'Không có báo cáo nào' : 'Danh sách trống'}
              </Text>
              <Text style={styles.emptyDesc}>
                {activeTab === 'REPORTED'
                  ? 'Hiện tại không có tin tuyển dụng nào bị báo cáo lừa đảo.'
                  : 'Hệ thống chưa có tin tuyển dụng nào.'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00B14F" />
          }
        />
      )}

      {/* Modal chi tiết báo cáo */}
      <Modal
        visible={detailJob !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailJob(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Chi tiết báo cáo vi phạm</Text>
              <TouchableOpacity onPress={() => setDetailJob(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {detailJob && (() => {
              const parsed = parseReportReason(detailJob.reportReason || '');
              const companyName = detailJob.company?.name || 'Không rõ';
              
              return (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                  
                  {/* PHẦN 1: THÔNG TIN BÁO CÁO */}
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="shield-outline" size={16} color="#EF4444" />
                      </View>
                      <Text style={styles.modalSectionTitle}>Thông tin phản ánh</Text>
                    </View>
                    <View style={styles.modalReportCard}>
                      <Text style={styles.modalReportReason}>
                        <Text style={{ fontWeight: '700', color: '#DC2626' }}>Lý do phản ánh: </Text>
                        {parsed.reasonText}
                      </Text>
                      
                      {parsed.reporter ? (
                        <View style={styles.reporterDetailsTable}>
                          <View style={styles.reporterDetailRow}>
                            <Ionicons name="person-outline" size={14} color="#64748B" style={styles.rowIcon} />
                            <Text style={styles.reporterDetailLabel}>Người báo cáo:</Text>
                            <Text style={styles.reporterDetailValue}>{parsed.reporter.name}</Text>
                          </View>
                          <View style={styles.reporterDetailRow}>
                            <Ionicons name="call-outline" size={14} color="#64748B" style={styles.rowIcon} />
                            <Text style={styles.reporterDetailLabel}>Số điện thoại:</Text>
                            <Text style={styles.reporterDetailValue}>{parsed.reporter.phone}</Text>
                          </View>
                          <View style={styles.reporterDetailRow}>
                            <Ionicons name="mail-outline" size={14} color="#64748B" style={styles.rowIcon} />
                            <Text style={styles.reporterDetailLabel}>Email liên hệ:</Text>
                            <Text style={styles.reporterDetailValue}>{parsed.reporter.email}</Text>
                          </View>
                          <View style={styles.reporterDetailRow}>
                            <Ionicons name="location-outline" size={14} color="#64748B" style={styles.rowIcon} />
                            <Text style={styles.reporterDetailLabel}>Địa chỉ phản ánh:</Text>
                            <Text style={styles.reporterDetailValue} numberOfLines={2}>{parsed.reporter.address}</Text>
                          </View>
                        </View>
                      ) : (
                        <Text style={styles.reporterInfoText}>
                          Người báo cáo: {detailJob.reportedBy || 'Ẩn danh'}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* PHẦN 2: CHI TIẾT CÔNG VIỆC */}
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={[styles.iconContainer, { backgroundColor: '#E6F7ED' }]}>
                        <Ionicons name="briefcase-outline" size={16} color="#00B14F" />
                      </View>
                      <Text style={styles.modalSectionTitle}>Chi tiết công việc</Text>
                    </View>
                    <View style={styles.modalJobCard}>
                      <Text style={styles.modalJobName}>{detailJob.name}</Text>
                      
                      <View style={styles.modalJobMetaGrid}>
                        <View style={styles.modalJobMetaBox}>
                          <Ionicons name="cash-outline" size={16} color="#00B14F" />
                          <Text style={styles.modalJobMetaVal}>
                            {detailJob.salary === 0 ? 'Thoả thuận' : `${(detailJob.salary / 1000000).toFixed(0)} triệu`}
                          </Text>
                          <Text style={styles.modalJobMetaLbl}>Mức lương</Text>
                        </View>
                        
                        <View style={styles.modalJobMetaBox}>
                          <Ionicons name="location-outline" size={16} color="#00B14F" />
                          <Text style={styles.modalJobMetaVal} numberOfLines={1}>{detailJob.location}</Text>
                          <Text style={styles.modalJobMetaLbl}>Địa điểm</Text>
                        </View>

                        <View style={styles.modalJobMetaBox}>
                          <Ionicons name="briefcase-outline" size={16} color="#00B14F" />
                          <Text style={styles.modalJobMetaVal} numberOfLines={1}>{detailJob.level || 'Nhân viên'}</Text>
                          <Text style={styles.modalJobMetaLbl}>Cấp bậc</Text>
                        </View>
                      </View>

                      {detailJob.description && (
                        <View style={styles.detailTextWrapper}>
                          <Text style={styles.detailTextLabel}>Mô tả công việc:</Text>
                          <Text style={styles.detailTextContent}>{detailJob.description}</Text>
                        </View>
                      )}

                      {detailJob.requirements && (
                        <View style={styles.detailTextWrapper}>
                          <Text style={styles.detailTextLabel}>Yêu cầu ứng viên:</Text>
                          <Text style={styles.detailTextContent}>{detailJob.requirements}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* PHẦN 3: THÔNG TIN DOANH NGHIỆP */}
                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
                        <Ionicons name="business-outline" size={16} color="#0284C7" />
                      </View>
                      <Text style={styles.modalSectionTitle}>Thông tin doanh nghiệp</Text>
                    </View>
                    <View style={styles.modalJobCard}>
                      <Text style={styles.modalJobName}>{companyName}</Text>
                      
                      {detailJob.company?.address && (
                        <View style={styles.detailTextWrapper}>
                          <Text style={styles.detailTextLabel}>Địa chỉ trụ sở:</Text>
                          <Text style={styles.detailTextContent}>{detailJob.company.address}</Text>
                        </View>
                      )}

                      {detailJob.company?.description && (
                        <View style={styles.detailTextWrapper}>
                          <Text style={styles.detailTextLabel}>Giới thiệu công ty:</Text>
                          <Text style={styles.detailTextContent}>{detailJob.company.description}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* CÁC NÚT THAO TÁC NHANH */}
                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity
                      style={[styles.modalActionBtn, { backgroundColor: '#F59E0B' }]}
                      onPress={() => {
                        setDetailJob(null);
                        handleWarnCompany(detailJob.id, detailJob.name, companyName);
                      }}
                    >
                      <Ionicons name="warning" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.modalActionBtnText}>Cảnh cáo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalActionBtn, { backgroundColor: '#DC2626' }]}
                      onPress={() => {
                        setDetailJob(null);
                        handleHideJob(detailJob.id, detailJob.name);
                      }}
                    >
                      <Ionicons name="eye-off" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.modalActionBtnText}>Ẩn tin</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalActionBtn, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' }]}
                      onPress={() => {
                        setDetailJob(null);
                        handleDismissReport(detailJob.id);
                      }}
                    >
                      <Ionicons name="checkmark" size={16} color="#475569" style={{ marginRight: 6 }} />
                      <Text style={[styles.modalActionBtnText, { color: '#475569' }]}>Bỏ qua</Text>
                    </TouchableOpacity>
                  </View>

                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#FFF7ED',
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
    color: '#EA580C',
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
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  jobName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  companyName: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  metaSep: {
    color: '#CBD5E1',
    fontSize: 12,
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
  btnHide: {
    backgroundColor: '#DC2626',
  },
  btnDismiss: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  
  // Modal Chi Tiết Báo Cáo Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    ...SHADOW.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalReportCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 16,
    ...SHADOW.sm,
  },
  modalReportReason: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 12,
  },
  reporterDetailsTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    borderWidth: 0.5,
    borderColor: '#FCA5A5',
  },
  reporterDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#FEE2E2',
  },
  rowIcon: {
    marginRight: 8,
    width: 16,
    textAlign: 'center',
  },
  reporterDetailLabel: {
    fontSize: 12,
    color: '#64748B',
    width: 100,
    fontWeight: '600',
  },
  reporterDetailValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
    flex: 1,
  },
  reporterInfoText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  modalJobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...SHADOW.sm,
  },
  modalJobName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  modalJobMetaGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: BORDER_RADIUS.md,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  modalJobMetaBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  modalJobMetaVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00B14F',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  modalJobMetaLbl: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  detailTextWrapper: {
    marginTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  detailTextLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  detailTextContent: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 46,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
