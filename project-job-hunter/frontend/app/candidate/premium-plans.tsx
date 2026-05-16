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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '@services/api';
import { useAuthStore } from '@store/authStore';

const { width } = Dimensions.get('window');

const CANDIDATE_PACKAGES = [
  {
    id: 'MONTHLY',
    name: 'Gói Tiết Kiệm',
    price: '50,000',
    period: '/ tháng',
    description: 'Trải nghiệm đầy đủ các tính năng Premium dành cho ứng viên.',
    features: [
      'Huy hiệu Checkmark Vàng trên Profile',
      'Ưu tiên hiển thị hồ sơ với Nhà tuyển dụng',
      'Mở khóa toàn bộ gợi ý việc làm từ AI',
      'Báo cáo phân tích mức độ phù hợp chi tiết',
    ],
    color: COLORS.primary,
    gradient: ['#F0FDF4', '#DCFCE7'],
  },
  {
    id: 'YEARLY',
    name: 'Gói Đặc Quyền',
    price: '499,000',
    period: '/ năm',
    description: 'Giải pháp tốt nhất để xây dựng thương hiệu cá nhân bền vững.',
    features: [
      'Toàn bộ tính năng gói Tháng',
      'Hỗ trợ chỉnh sửa CV chuyên nghiệp 1-1',
      'Tiết kiệm 20% so với mua lẻ từng tháng',
      'Ưu tiên hỗ trợ kỹ thuật 24/7',
    ],
    color: '#EAB308',
    gradient: ['#FEFCE8', '#FEF9C3'],
    popular: true,
  }
];

export default function CandidatePremiumPlans() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const getTierRank = (tier: string | undefined) => {
    if (!tier) return 0;
    if (tier === 'MONTHLY') return 1;
    if (tier === 'YEARLY') return 2;
    return 0;
  };

  const handleSubscribe = async (pkg: typeof CANDIDATE_PACKAGES[0]) => {
    // Note: Candidates currently don't store tier in AuthStore yet, 
    // but we can assume based on isPremiumCandidate
    const currentRank = user?.isPremiumCandidate ? 1 : 0; // Default to 1 if premium
    const targetRank = getTierRank(pkg.id);

    if (user?.isPremiumCandidate && targetRank === 1) {
      Alert.alert('Thông báo', 'Bạn đang sử dụng gói Premium.');
      return;
    }

    if (currentRank > targetRank) {
      Alert.alert('Thông báo', 'Bạn không thể hạ cấp gói dịch vụ khi gói hiện tại còn hiệu lực.');
      return;
    }

    const upgradeMsg = !user?.isPremiumCandidate
      ? `Bạn chọn đăng ký ${pkg.name}.`
      : `Bạn đang sử dụng gói Tháng. Bạn có chắc muốn nâng cấp lên gói Năm?`;

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
                tier: pkg.id,
                packageId: pkg.id
              }) as any;
              
              if (res.qrUrl) {
                Alert.alert(
                  'Đơn hàng đã tạo',
                  `Mã đơn: ${res.orderCode}\nSố tiền: ${res.amount.toLocaleString()}đ\n\nTrong bản demo này, bạn có thể nhấn nút dưới đây để giả lập thanh toán thành công.`,
                  [
                    { text: 'Đóng', style: 'cancel' },
                    { 
                      text: 'Thanh toán giả lập (TEST)', 
                      onPress: async () => {
                        try {
                          setLoading(true);
                          await api.post(`/payment/mock/simulate-success/${res.orderCode}`);
                          Alert.alert('Thành công', 'Chúc mừng! Bạn đã trở thành ứng viên Premium.', [
                            { text: 'Về Profile', onPress: () => router.push('/(tabs)/profile') }
                          ]);
                        } catch (e: any) {
                          Alert.alert('Lỗi', 'Không thể giả lập: ' + e.message);
                        } finally {
                          setLoading(false);
                        }
                      }
                    }
                  ]
                );
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
        headerTitle: 'Nâng cấp Premium',
        headerTransparent: true,
        headerTintColor: COLORS.white 
      }} />
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop' }} 
            style={styles.headerBg} 
          />
          <View style={styles.headerOverlay} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Hồ sơ nổi bật, việc tốt tìm đến</Text>
            <Text style={styles.headerSubtitle}>Tăng 500% cơ hội được nhà tuyển dụng săn đón</Text>
          </View>
        </View>

        <View style={styles.plansContainer}>
          {CANDIDATE_PACKAGES.map((pkg) => (
            <View 
              key={pkg.id} 
              style={[
                styles.planCard, 
                pkg.popular && styles.popularCard
              ]}
            >
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>GIÁ TRỊ NHẤT</Text>
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
                const isActive = user?.isPremiumCandidate && pkg.id === 'MONTHLY'; // Simple check
                // For Yearly, it's active if they bought it, but currently we don't store tier for candidates
                // Let's just use isPremiumCandidate for now as a general flag
                
                return (
                  <TouchableOpacity 
                    style={[
                      styles.subscribeBtn, 
                      { 
                        backgroundColor: (user?.isPremiumCandidate && pkg.id === 'MONTHLY') ? '#10B981' : pkg.color,
                        opacity: loading ? 0.6 : 1
                      }
                    ]}
                    onPress={() => handleSubscribe(pkg)}
                    disabled={loading || (user?.isPremiumCandidate && pkg.id === 'MONTHLY')}
                  >
                    <Text style={styles.subscribeBtnText}>
                      {(user?.isPremiumCandidate && pkg.id === 'MONTHLY') ? 'Đang sử dụng' : 'Đăng ký ngay'}
                    </Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          ))}
        </View>

        <View style={styles.footerInfo}>
          <Ionicons name="lock-closed" size={20} color={COLORS.success} />
          <Text style={styles.footerText}>Bảo mật & An toàn tuyệt đối</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { height: 220, position: 'relative' },
  headerBg: { width: '100%', height: '100%' },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.75)' },
  headerContent: { position: 'absolute', bottom: 30, left: 24, right: 24 },
  headerTitle: { ...TYPOGRAPHY.h1, color: COLORS.white, fontSize: 24, marginBottom: 8 },
  headerSubtitle: { ...TYPOGRAPHY.body2, color: 'rgba(255,255,255,0.8)' },
  plansContainer: { padding: 20, marginTop: -20 },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    ...SHADOW.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  popularCard: { borderColor: '#EAB308', borderWidth: 2 },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#EAB308',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: { fontSize: 10, fontWeight: '900', color: COLORS.white },
  packageName: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  currency: { fontSize: 18, fontWeight: '700', marginRight: 2, color: '#1E293B' },
  price: { fontSize: 30, fontWeight: '900', color: '#1E293B' },
  period: { fontSize: 14, color: '#64748B', marginLeft: 4 },
  packageDesc: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 20 },
  featuresList: { marginBottom: 24 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  featureText: { fontSize: 13, color: '#334155', flex: 1 },
  subscribeBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', ...SHADOW.sm },
  subscribeBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  footerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 0 },
  footerText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
});
