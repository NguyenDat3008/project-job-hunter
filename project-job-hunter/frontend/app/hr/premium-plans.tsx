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

export default function PremiumPlans() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (pkg: typeof PACKAGES[0]) => {
    if (pkg.id === 'BASIC') {
      Alert.alert('Thông báo', 'Bạn đang sử dụng gói Cơ bản mặc định.');
      return;
    }

    Alert.alert(
      'Xác nhận đăng ký',
      `Bạn chọn đăng ký ${pkg.name}. Bạn sẽ được chuyển hướng đến cổng thanh toán VNPay.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Thanh toán ngay', 
          onPress: async () => {
            try {
              setLoading(true);
              // Call API to create order
              const res = await api.post('/payment/create-order', {
                tier: pkg.id === 'ENTERPRISE' ? 'YEARLY' : 'MONTHLY',
                packageId: pkg.id
              }) as any;
              
              if (res.qrUrl) {
                // In real app, we would open a WebView or deep link to Banking App
                // Here we show the payment info
                Alert.alert(
                  'Đơn hàng đã tạo',
                  `Mã đơn: ${res.orderCode}\nSố tiền: ${res.amount.toLocaleString()}đ\n\n(Trong bản demo, Admin sẽ duyệt Premium cho bạn ngay lập tức)`,
                  [{ text: 'OK', onPress: () => router.back() }]
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
              
              <TouchableOpacity 
                style={[
                  styles.subscribeBtn, 
                  { backgroundColor: pkg.id === 'BASIC' && !user?.company?.isPremium ? '#94A3B8' : (user?.company?.premiumTier === pkg.id ? '#10B981' : pkg.color) }
                ]}
                onPress={() => handleSubscribe(pkg)}
                disabled={loading || (user?.company?.isPremium && user?.company?.premiumTier === pkg.id)}
              >
                <Text style={styles.subscribeBtnText}>
                  {user?.company?.isPremium 
                    ? (user?.company?.premiumTier === pkg.id ? 'Đang sử dụng' : 'Nâng cấp ngay')
                    : (pkg.id === 'BASIC' ? 'Đang sử dụng' : 'Đăng ký ngay')}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.footerInfo}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
          <Text style={styles.footerText}>Thanh toán an toàn qua cổng VNPay / VietQR</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
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
});
