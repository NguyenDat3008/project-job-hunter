// Premium Packages Screen for Employers
import { Button, LoadingSpinner } from '@components/index';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants/theme';
import { premiumService } from '@services/premiumService';
import { PremiumPackage } from '@/types/premium.types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

const TIER_COLORS: Record<string, string> = {
  BASIC: '#6366F1',
  PRO: '#F59E0B',
  ENTERPRISE: '#10B981',
};

export default function PremiumScreen() {
  const router = useRouter();
  const [packages, setPackages] = useState<PremiumPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPackages(); }, []);

  const loadPackages = async () => {
    try {
      const data = await premiumService.getPackages();
      setPackages(data);
    } catch (error) {
      console.error('Error fetching premium packages', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (pkg: PremiumPackage) => {
    Alert.alert(
      'Xác nhận đăng ký',
      `Bạn muốn đăng ký gói ${pkg.name} với giá ${new Intl.NumberFormat('vi-VN').format(pkg.price)} VNĐ?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng ký',
          onPress: async () => {
            try {
              await premiumService.subscribe(pkg.id);
              Alert.alert('Thành công', 'Đăng ký thành công! Mở khóa ngay các tính năng Premium.');
              router.back();
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể đăng ký lúc này.');
            }
          }
        }
      ]
    );
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nâng Tầm Doanh Nghiệp</Text>
        <Text style={styles.headerSubtitle}>
          Giải pháp tuyển dụng toàn diện, tiếp cận ứng viên xuất sắc nhất bằng sức mạnh của AI.
        </Text>
      </View>

      <View style={styles.packagesContainer}>
        {packages.map(pkg => {
          const tierColor = TIER_COLORS[pkg.tier] || COLORS.primary;
          return (
            <View
              key={pkg.id}
              style={[styles.packageCard, pkg.isPopular && [styles.packageCardPopular, { borderColor: tierColor }]]}
            >
              {pkg.isPopular && (
                <View style={[styles.popularBadge, { backgroundColor: tierColor }]}>
                  <Text style={styles.popularText}>ĐƯỢC ƯA CHUỘNG NHẤT</Text>
                </View>
              )}

              <View style={styles.pkgHeader}>
                <View style={[styles.tierBadge, { backgroundColor: tierColor + '15' }]}>
                  <Text style={[styles.tierText, { color: tierColor }]}>{pkg.tier}</Text>
                </View>
                <Text style={styles.pkgName}>{pkg.name}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.price}>{new Intl.NumberFormat('vi-VN').format(pkg.price)}</Text>
                <Text style={styles.currency}> VNĐ / tháng</Text>
              </View>

              <View style={styles.featuresList}>
                {pkg.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <View style={[
                      styles.featureCheck,
                      { backgroundColor: feature.included ? COLORS.success + '20' : COLORS.gray[200] }
                    ]}>
                      <Text style={[
                        styles.featureCheckText,
                        { color: feature.included ? COLORS.success : COLORS.gray[400] }
                      ]}>
                        {feature.included ? '✓' : '—'}
                      </Text>
                    </View>
                    <Text style={[styles.featureText, !feature.included && styles.featureTextDisabled]}>
                      {feature.name}
                    </Text>
                  </View>
                ))}
              </View>

              <Button
                title={pkg.isPopular ? 'Bắt đầu ngay' : 'Đăng ký'}
                variant={pkg.isPopular ? 'primary' : 'outline'}
                onPress={() => handleSubscribe(pkg)}
                fullWidth
              />
            </View>
          );
        })}
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.secondary },
  header: {
    backgroundColor: COLORS.black,
    padding: SPACING.xl, paddingTop: 40, paddingBottom: 60,
    alignItems: 'center',
  },
  headerTitle: { ...TYPOGRAPHY.h1, color: COLORS.gold, marginBottom: SPACING.sm, textAlign: 'center' },
  headerSubtitle: { ...TYPOGRAPHY.body2, color: COLORS.white, opacity: 0.8, textAlign: 'center' },
  packagesContainer: { padding: SPACING.lg, marginTop: -40 },
  packageCard: {
    backgroundColor: COLORS.white, borderRadius: 20,
    padding: SPACING.xl, marginBottom: SPACING.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 8,
    position: 'relative',
  },
  packageCardPopular: {
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute', top: -14, alignSelf: 'center',
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20,
  },
  popularText: { fontSize: 10, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
  pkgHeader: { alignItems: 'center', marginBottom: SPACING.md },
  tierBadge: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 8, marginBottom: 8,
  },
  tierText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  pkgName: { ...TYPOGRAPHY.h2, color: COLORS.text.primary },
  priceRow: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center',
    marginBottom: SPACING.xl, paddingBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.gray[100],
  },
  price: { fontSize: 32, fontWeight: '800', color: COLORS.text.primary },
  currency: { ...TYPOGRAPHY.body2, color: COLORS.text.secondary },
  featuresList: { marginBottom: SPACING.xl },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  featureCheck: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: SPACING.sm,
  },
  featureCheckText: { fontSize: 13, fontWeight: '700' },
  featureText: { ...TYPOGRAPHY.body2, color: COLORS.text.primary, flex: 1 },
  featureTextDisabled: { color: COLORS.text.light, textDecorationLine: 'line-through' },
});
