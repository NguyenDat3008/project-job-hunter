import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '@services/api';
import { ENDPOINTS, API_CONFIG } from '@constants/endpoints';
import LoadingSpinner from '@components/LoadingSpinner/LoadingSpinner';

interface Company {
  id: number;
  name: string;
  address: string;
  logo?: string;
  website?: string;
  description?: string;
  industry?: string;
  size?: string;
  active: boolean;
  isPremium: boolean;
  premiumTier?: 'BASIC' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
  createdBy: string;
  pendingName?: string;
  pendingLogo?: string;
  updateReason?: string;
  premiumExpiryDate?: string;
}

interface Stats {
  totalUsers: number;
  totalCompanies: number;
  totalJobs: number;
  totalResumes: number;
  pendingCompanies: number;
  inactiveJobs: number;
}

const AdminDashboard = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = async () => {
    try {
      const [companiesRes, statsRes] = await Promise.all([
        api.get(ENDPOINTS.COMPANIES.LIST, { params: { size: 100 } }),
        api.get(ENDPOINTS.STATISTICS.ADMIN)
      ]);
      
      const companiesArray = Array.isArray(companiesRes) ? companiesRes : ((companiesRes as any)?.result || []);
      // Hiển thị cả cty đang chờ và cty mới active để admin dễ quản lý premium
      setCompanies(companiesArray);
      setStats(statsRes as any);
    } catch (error: any) {
      console.error('Fetch admin data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (company: Company) => {
    Alert.alert(
      'Xác nhận phê duyệt',
      `Bạn có chắc chắn muốn phê duyệt cho công ty ${company.name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Phê duyệt',
          onPress: async () => {
            try {
              console.log('>>> [DASHBOARD] Approving company ID:', company.id);
              await api.put(ENDPOINTS.COMPANIES.UPDATE, {
                id: company.id,
                active: true,
                isPremium: company.isPremium,
                premiumTier: company.premiumTier,
                premiumExpiryDate: company.premiumExpiryDate
              });
              Alert.alert('Thành công', 'Đã phê duyệt các thay đổi thành công.');
              setShowDetailModal(false);
              fetchData();
            } catch (error: any) {
              console.error('>>> [DASHBOARD] Approve error:', error);
              Alert.alert('Lỗi', error.message || 'Không thể phê duyệt.');
            }
          },
        },
      ]
    );
  };

  const handleTogglePremium = async (company: Company, tier: 'BASIC' | 'PRO' | 'ENTERPRISE' = 'PRO') => {
    try {
      const isCurrentlyPremium = company.isPremium;
      await api.put(ENDPOINTS.COMPANIES.UPDATE, {
        ...company,
        isPremium: !isCurrentlyPremium,
        premiumTier: !isCurrentlyPremium ? tier : null,
      });
      
      Alert.alert('Thành công', `Đã ${!isCurrentlyPremium ? 'nâng cấp' : 'hủy'} trạng thái Premium.`);
      if (selectedCompany?.id === company.id) {
        setSelectedCompany({ 
          ...company, 
          isPremium: !isCurrentlyPremium,
          premiumTier: !isCurrentlyPremium ? tier : undefined
        });
      }
      fetchData();
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái Premium.');
    }
  };

  const handleReject = async () => {
    if (!selectedCompany) return;
    if (!rejectReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối.');
      return;
    }

    try {
      await api.put(ENDPOINTS.COMPANIES.UPDATE, {
        ...selectedCompany,
        updateReason: `Từ chối: ${rejectReason}`,
        active: false
      });
      
      Alert.alert('Thành công', 'Đã gửi phản hồi từ chối cho doanh nghiệp.');
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectReason('');
      fetchData();
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể thực hiện yêu cầu.');
    }
  };

  const renderCompanyItem = ({ item }: { item: Company }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        setSelectedCompany(item);
        setShowDetailModal(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.logoWrap}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.logo} />
          ) : (
            <Ionicons name="business" size={24} color={COLORS.primary} />
          )}
          {item.isPremium && (
            <View style={styles.proTickSmall}>
              <Ionicons name="checkmark-circle" size={12} color="#EAB308" />
            </View>
          )}
        </View>
        <View style={styles.companyInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.companyName} numberOfLines={1}>{item.name}</Text>
            {!item.active && (
              <View style={[styles.statusBadgeSmall, { backgroundColor: COLORS.warning + '20' }]}>
                <Text style={[styles.statusTextSmall, { color: COLORS.warning }]}>CHỜ DUYỆT</Text>
              </View>
            )}
            {item.isPremium && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>{item.premiumTier || 'PRO'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.companyAddress} numberOfLines={1}>{item.address}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.dateText}>Gửi bởi: {item.createdBy}</Text>
            <Text style={styles.dateText}> • </Text>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray[300]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Quản trị hệ thống' }} />
      
      <View style={styles.statsScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Người dùng</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.statNumber, { color: COLORS.error }]}>{stats?.pendingCompanies || 0}</Text>
            <Text style={[styles.statLabel, { color: COLORS.error }]}>Cty chờ duyệt</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#E0F2FE' }]}>
            <Text style={[styles.statNumber, { color: COLORS.secondary }]}>{stats?.totalJobs || 0}</Text>
            <Text style={[styles.statLabel, { color: COLORS.secondary }]}>Việc làm</Text>
          </View>
          <TouchableOpacity 
            style={[styles.statBox, { backgroundColor: COLORS.primaryLight }]}
            onPress={() => router.push('/admin/broadcast' as any)}
          >
            <Ionicons name="megaphone" size={24} color={COLORS.primary} />
            <Text style={styles.statLabel}>Broadcast</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <Text style={styles.sectionTitle}>Quản lý yêu cầu đăng ký & Premium</Text>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={companies}
          renderItem={renderCompanyItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cafe-outline" size={60} color={COLORS.border} />
              <Text style={styles.emptyText}>Hiện không có công ty nào.</Text>
            </View>
          }
        />
      )}

      {/* Detail View Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={styles.detailOverlay}>
          <View style={styles.detailContent}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Chi tiết công ty</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.detailScroll}>
              <View style={styles.detailHero}>
                <View style={styles.detailLogoWrap}>
                  {selectedCompany?.logo ? (
                    <Image 
                      source={{ uri: selectedCompany.logo.startsWith('http') ? selectedCompany.logo : (API_CONFIG.BASE_URL.replace('/api', '') + '/storage/' + selectedCompany.logo) }} 
                      style={styles.detailLogo} 
                    />
                  ) : (
                    <Ionicons name="business" size={40} color={COLORS.primary} />
                  )}
                  {selectedCompany?.isPremium && (
                    <View style={styles.proTickLarge}>
                      <Ionicons name="checkmark-circle" size={24} color="#EAB308" />
                    </View>
                  )}
                </View>
                <View style={styles.detailNameRow}>
                  <Text style={styles.detailCompanyName}>{selectedCompany?.name}</Text>
                  {selectedCompany?.isPremium && (
                    <View style={styles.proBadgeLarge}>
                      <Text style={styles.proBadgeTextLarge}>{selectedCompany?.premiumTier || 'PREMIUM'}</Text>
                    </View>
                  )}
                </View>

                {/* Premium Tiers Control */}
                <View style={styles.tierContainer}>
                  <Text style={styles.tierLabel}>Gói Premium:</Text>
                  <View style={styles.tierRow}>
                    {(['BASIC', 'PRO', 'ENTERPRISE'] as const).map((tier) => (
                      <TouchableOpacity 
                        key={tier}
                        style={[
                          styles.tierBtn, 
                          selectedCompany?.premiumTier === tier && styles.tierBtnActive
                        ]}
                        onPress={() => selectedCompany && handleTogglePremium(selectedCompany, tier)}
                      >
                        <Text style={[
                          styles.tierBtnText,
                          selectedCompany?.premiumTier === tier && styles.tierBtnTextActive
                        ]}>{tier}</Text>
                      </TouchableOpacity>
                    ))}
                    {selectedCompany?.isPremium && (
                      <TouchableOpacity 
                        style={styles.tierBtnCancel}
                        onPress={() => selectedCompany && handleTogglePremium(selectedCompany)}
                      >
                        <Ionicons name="close-circle" size={16} color={COLORS.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <DetailRow icon="person-outline" label="Người yêu cầu" value={selectedCompany?.createdBy} />
                <DetailRow icon="location-outline" label="Địa chỉ" value={selectedCompany?.address} />
                <DetailRow icon="globe-outline" label="Website" value={selectedCompany?.website || 'Chưa cung cấp'} />
                <DetailRow icon="briefcase-outline" label="Lĩnh vực" value={selectedCompany?.industry || 'Chưa cung cấp'} />
                <DetailRow icon="people-outline" label="Quy mô" value={selectedCompany?.size || 'Chưa cung cấp'} />
                
                {(selectedCompany?.pendingName || selectedCompany?.pendingLogo) && (
                  <View style={styles.pendingSection}>
                    <View style={styles.pendingHeader}>
                      <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
                      <Text style={styles.pendingTitle}>YÊU CẦU THAY ĐỔI ĐANG CHỜ</Text>
                    </View>
                    
                    {selectedCompany.pendingName && (
                      <View style={styles.pendingRow}>
                        <Text style={styles.pendingLabel}>Tên mới:</Text>
                        <Text style={styles.pendingValue}>{selectedCompany.pendingName}</Text>
                      </View>
                    )}
                    
                    {selectedCompany.pendingLogo && (
                      <View style={styles.pendingRow}>
                        <Text style={styles.pendingLabel}>Logo mới:</Text>
                        <View style={styles.pendingLogoBox}>
                          <Image 
                            source={{ uri: selectedCompany.pendingLogo.startsWith('http') ? selectedCompany.pendingLogo : (`${API_CONFIG.BASE_URL}/files/download?fileName=${selectedCompany.pendingLogo}`) }} 
                            style={styles.pendingLogoImg} 
                          />
                        </View>
                      </View>
                    )}
                    
                    {selectedCompany.updateReason && (
                      <View style={styles.pendingRow}>
                        <Text style={styles.pendingLabel}>Lý do:</Text>
                        <Text style={styles.pendingReason}>{selectedCompany.updateReason}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Mô tả công ty</Text>
                <Text style={styles.descriptionText}>
                  {selectedCompany?.description || 'Không có mô tả.'}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.detailActions}>
              {!selectedCompany?.active && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.rejectBtnLarge]} 
                    onPress={() => setShowRejectModal(true)}
                  >
                    <Text style={styles.rejectBtnTextLarge}>Từ chối</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.approveBtnLarge]} 
                    onPress={() => selectedCompany && handleApprove(selectedCompany)}
                  >
                    <Text style={styles.approveBtnTextLarge}>Phê duyệt ngay</Text>
                  </TouchableOpacity>
                </>
              )}
              {selectedCompany?.active && (
                <View style={{ flex: 1 }}>
                  {(selectedCompany?.pendingName || selectedCompany?.pendingLogo) ? (
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.approveBtnLarge]} 
                      onPress={() => selectedCompany && handleApprove(selectedCompany)}
                    >
                      <Text style={styles.approveBtnTextLarge}>Phê duyệt thay đổi</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.activeFooter}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                      <Text style={styles.activeFooterText}>Công ty này đã được kích hoạt</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal visible={showRejectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Lý do từ chối</Text>
            <Text style={styles.modalSubtitle}>Nhập lý do để phản hồi cho công ty {selectedCompany?.name}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="VD: Thông tin công ty chưa chính xác..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmRejectBtn]} 
                onPress={handleReject}
              >
                <Text style={styles.confirmBtnText}>Gửi phản hồi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DetailRow = ({ icon, label, value }: { icon: any, label: string, value?: string }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={20} color={COLORS.primary} />
    <View style={styles.detailRowContent}>
      <Text style={styles.detailRowLabel}>{label}</Text>
      <Text style={styles.detailRowValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  statsScroll: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
  },
  statsContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  statBox: {
    width: 100,
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
  },
  statNumber: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    padding: SPACING.md,
    color: COLORS.text.primary,
  },
  listContent: {
    padding: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  proTickSmall: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.white,
    borderRadius: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  companyName: {
    ...TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.text.primary,
    maxWidth: '60%',
  },
  statusBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusTextSmall: {
    fontSize: 8,
    fontWeight: '800',
  },
  proBadge: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#EAB308',
  },
  proBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#EAB308',
  },
  companyInfo: {
    flex: 1,
  },
  companyAddress: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 10,
    color: COLORS.text.tertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.tertiary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  // Detail Modal Styles
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingTop: SPACING.md,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
  },
  detailScroll: {
    flex: 1,
  },
  detailHero: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.gray[50],
  },
  detailLogoWrap: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  detailLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  proTickLarge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  detailNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailCompanyName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  proBadgeLarge: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  proBadgeTextLarge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#EAB308',
  },
  tierContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  tierLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text.tertiary,
    marginBottom: 8,
  },
  tierRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  tierBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  tierBtnActive: {
    backgroundColor: '#FEF9C3',
    borderColor: '#EAB308',
  },
  tierBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  tierBtnTextActive: {
    color: '#EAB308',
  },
  tierBtnCancel: {
    marginLeft: 4,
  },
  detailSection: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  sectionLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  detailRowContent: {
    flex: 1,
  },
  detailRowLabel: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  detailRowValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  descriptionText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  detailActions: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  activeFooter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  activeFooterText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.success,
    fontWeight: '600',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnLarge: {
    backgroundColor: COLORS.primary,
    ...SHADOW.md,
  },
  rejectBtnLarge: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  approveBtnTextLarge: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  rejectBtnTextLarge: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  modalSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  modalInput: {
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.gray[200],
  },
  confirmRejectBtn: {
    backgroundColor: COLORS.error,
  },
  cancelBtnText: {
    color: COLORS.text.primary,
    fontWeight: '700',
  },
  confirmBtnText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  pendingSection: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pendingTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#92400E',
  },
  pendingRow: {
    marginBottom: 8,
  },
  pendingLabel: {
    fontSize: 11,
    color: '#92400E',
    opacity: 0.8,
    marginBottom: 4,
  },
  pendingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  pendingLogoBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    ...SHADOW.sm,
    padding: 5,
  },
  pendingLogoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  pendingReason: {
    fontSize: 12,
    color: '#B45309',
    fontStyle: 'italic',
  },
});

export default AdminDashboard;
