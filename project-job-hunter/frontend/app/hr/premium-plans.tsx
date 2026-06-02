import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '@services/api';
import { useAuthStore } from '@store/authStore';

const { width } = Dimensions.get('window');

const PACKAGES = [
  {
    id: 'BASIC',
    name: 'Gói Cơ bản',
    price: '0',
    description: 'Dành cho doanh nghiệp mới bắt đầu tuyển dụng.',
    features: [
      'Đăng tối đa 5 tin tuyển dụng',
      'Hiển thị thông tin cơ bản',
      'Nhận hồ sơ ứng viên qua app',
    ],
    color: '#94A3B8',
    gradient: ['#F8FAFC', '#E2E8F0'],
  },
  {
    id: 'PRO',
    name: 'Gói Chuyên nghiệp',
    price: '500,000',
    period: '/ tháng',
    description: 'Nâng tầm thương hiệu, thu hút ứng viên chất lượng.',
    features: [
      'Đăng không giới hạn tin tuyển dụng',
      'Ưu tiên hiển thị lên đầu kết quả tìm kiếm',
      'Huy hiệu PRO Vàng trên Profile',
      'Gợi ý AI ứng viên phù hợp nhất',
    ],
    color: '#EAB308',
    gradient: ['#FEFCE8', '#FEF9C3'],
    popular: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Gói Doanh nghiệp',
    price: '5,000,000',
    period: '/ năm',
    description: 'Giải pháp tuyển dụng toàn diện cho tập đoàn.',
    features: [
      'Toàn bộ tính năng gói PRO',
      'Tin tuyển dụng được gắn nhãn HOT/URGENT',
      'Banner quảng cáo trang chủ',
      'Hỗ trợ quản lý riêng 24/7',
    ],
    color: '#1E293B',
    gradient: ['#F1F5F9', '#CBD5E1'],
  }
];

export default function HrPremiumPlans() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  const getTierRank = (tier: string | undefined) => {
    if (!tier || tier === 'BASIC') return 0;
    if (tier === 'PRO' || tier === 'MONTHLY') return 1;
    if (tier === 'ENTERPRISE' || tier === 'YEARLY') return 2;
    return 0;
  };

  const handleSubscribe = async (pkg: typeof PACKAGES[0]) => {
    const currentTier = user?.company?.isPremium ? user?.company?.premiumTier : 'BASIC';
    const currentRank = getTierRank(currentTier);
    const targetRank = getTierRank(pkg.id);

    if (currentRank === targetRank) {
      Alert.alert('Thông báo', `Bạn đang sử dụng ${pkg.name}.`);
      return;
    }

    if (currentRank > targetRank) {
      Alert.alert('Thông báo', 'Bạn không thể hạ cấp gói dịch vụ khi gói hiện tại còn hiệu lực.');
      return;
    }

    // Upgrade logic
    const upgradeMsg = currentRank === 0 
      ? `Bạn chọn đăng ký ${pkg.name}.`
      : `Bạn đang sử dụng gói ${currentTier}. Bạn có chắc muốn nâng cấp lên ${pkg.name}?`;

    Alert.alert(
      'Xác nhận đăng ký',
      upgradeMsg,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Tiến hành', 
          onPress: async () => {
            try {
              setLoading(true);
              const res = await api.post('/payment/create-order', {
                tier: pkg.id === 'ENTERPRISE' ? 'YEARLY' : 'MONTHLY',
                packageId: pkg.id
              }) as any;
              
              const data = res?.data || res;
              if (data && data.qrUrl) {
                setOrderData(data);
                setPaymentModalVisible(true);
              }
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể tạo đơn hàng.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        headerTitle: 'Gói dịch vụ Premium',
        headerTransparent: true,
        headerTintColor: COLORS.white 
      }} />
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop' }} 
            style={styles.headerBg} 
          />
          <View style={styles.headerOverlay} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Nâng tầm thương hiệu tuyển dụng</Text>
            <Text style={styles.headerSubtitle}>Thu hút ứng viên gấp 5 lần với các đặc quyền Premium</Text>
          </View>
        </View>

        <View style={styles.plansContainer}>
          {PACKAGES.map((pkg) => (
            <View 
              key={pkg.id} 
              style={[
                styles.planCard, 
                pkg.popular && styles.popularCard
              ]}
            >
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>PHỔ BIẾN NHẤT</Text>
                </View>
              )}
              
              <Text style={[styles.packageName, { color: pkg.color }]}>{pkg.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.currency}>đ</Text>
                <Text style={styles.price}>{pkg.price}</Text>
                {pkg.period && <Text style={styles.period}>{pkg.period}</Text>}
              </View>
              
              <Text style={styles.packageDesc}>{pkg.description}</Text>
              
              <View style={styles.divider} />
              
              <View style={styles.featuresList}>
                {pkg.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color={pkg.color} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              
              {(() => {
                const currentTier = user?.company?.isPremium ? user?.company?.premiumTier : 'BASIC';
                const currentRank = getTierRank(currentTier);
                const targetRank = getTierRank(pkg.id);
                const isActive = currentRank === targetRank;
                const isDowngrade = currentRank > targetRank;

                return (
                  <TouchableOpacity 
                    style={[
                      styles.subscribeBtn, 
                      { 
                        backgroundColor: isActive ? '#10B981' : (isDowngrade ? '#94A3B8' : pkg.color),
                        opacity: loading ? 0.6 : 1
                      }
                    ]}
                    onPress={() => handleSubscribe(pkg)}
                    disabled={loading || isActive || isDowngrade}
                  >
                    <Text style={styles.subscribeBtnText}>
                      {isActive ? 'Đang sử dụng' : (isDowngrade ? 'Đã sở hữu' : 'Nâng cấp ngay')}
                    </Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          ))}
        </View>

        <View style={styles.footerInfo}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
          <Text style={styles.footerText}>Thanh toán an toàn qua cổng VNPay / VietQR</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thanh toán quét mã VietQR</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Text style={styles.paymentGuide}>
                Quét mã QR dưới đây bằng ứng dụng Ngân hàng (Mobile Banking) để thực hiện chuyển khoản tự động.
              </Text>

              <View style={styles.qrContainer}>
                {orderData?.qrUrl ? (
                  <Image
                    source={{ uri: orderData.qrUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                ) : null}
              </View>

              <View style={styles.billingDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mã đơn hàng</Text>
                  <Text style={styles.detailValue}>{orderData?.orderCode}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số tiền</Text>
                  <Text style={[styles.detailValue, { color: '#EAB308', fontWeight: '800' }]}>
                    {orderData?.amount?.toLocaleString()}đ
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái</Text>
                  <Text style={[styles.detailValue, { color: '#F59E0B' }]}>Đang chờ quét...</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.simulateBtn}
                onPress={async () => {
                  try {
                    setLoading(true);
                    await api.post(`/payment/mock/simulate-success/${orderData?.orderCode}`);
                    setPaymentModalVisible(false);
                    Alert.alert('Thành công', 'Nâng cấp thành công! Vui lòng đăng nhập lại để cập nhật quyền lợi.', [
                      { text: 'OK', onPress: () => router.push('/(tabs)/profile') }
                    ]);
                  } catch (e: any) {
                    Alert.alert('Lỗi', 'Không thể giả lập: ' + e.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.simulateBtnText}>Thanh toán giả lập (TEST)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Đóng</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 240,
    position: 'relative',
  },
  headerBg: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
  },
  headerContent: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body2,
    color: 'rgba(255,255,255,0.8)',
  },
  plansContainer: {
    padding: 20,
    marginTop: -20,
  },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    ...SHADOW.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  popularCard: {
    borderColor: '#EAB308',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#EAB308',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.white,
  },
  packageName: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  currency: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 2,
    color: '#1E293B',
  },
  price: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
  },
  period: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  packageDesc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 20,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
  },
  subscribeBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...SHADOW.sm,
  },
  subscribeBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '90%',
    ...SHADOW.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  paymentGuide: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  qrContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: width - 48,
    height: width - 48,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  billingDetails: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
  },
  simulateBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOW.sm,
  },
  simulateBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 15,
  },
});
