import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '@services/api';
import { ENDPOINTS } from '@constants/endpoints';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CompanyStats {
  totalJobs: number;
  totalEmployees: number;
}

const CompanyDetailScreen = () => {
  const { id, companyData } = useLocalSearchParams();
  const [company, setCompany] = useState<any>(null);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyData) {
      setCompany(JSON.parse(companyData as string));
    }
    fetchStats();
  }, [id]);

  const fetchStats = async () => {
    try {
      const response = await api.get(`${ENDPOINTS.STATISTICS.COMPANY}?id=${id}`);
      setStats(response as any);
    } catch (error) {
      console.error('Error fetching company stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !company) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerTitle: 'Chi tiết doanh nghiệp',
          headerTintColor: COLORS.text.primary,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Company Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {company?.logo ? (
              <Image source={{ uri: company.logo }} style={styles.logo} resizeMode="contain" />
            ) : (
              <Ionicons name="business" size={40} color={COLORS.primary} />
            )}
          </View>
          <Text style={styles.companyName}>{company?.name}</Text>
          <Text style={styles.companyIndustry}>{company?.industry || 'Lĩnh vực chưa cập nhật'}</Text>
          
          <View style={[styles.statusBadge, { backgroundColor: company?.active ? '#DEF7EC' : '#FDE8E8' }]}>
            <Text style={[styles.statusText, { color: company?.active ? '#03543F' : '#9B1C1C' }]}>
              {company?.active ? 'Đang hoạt động' : 'Chờ phê duyệt'}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.totalJobs || 0}</Text>
            <Text style={styles.statLabel}>Tin tuyển dụng</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.totalEmployees || 0}</Text>
            <Text style={styles.statLabel}>Nhân sự (HR)</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin doanh nghiệp</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color={COLORS.text.secondary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Địa chỉ</Text>
              <Text style={styles.infoValue}>{company?.address || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="globe-outline" size={20} color={COLORS.text.secondary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Website</Text>
              <Text style={styles.infoValue}>{company?.website || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={20} color={COLORS.text.secondary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Quy mô</Text>
              <Text style={styles.infoValue}>{company?.size ? `${company.size} nhân viên` : 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="star-outline" size={20} color={COLORS.text.secondary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Trạng thái Premium</Text>
              <Text style={[styles.infoValue, company?.isPremium && { color: COLORS.warning, fontWeight: 'bold' }]}>
                {company?.isPremium ? `Premium (${company.premiumTier})` : 'Tài khoản thường'}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Giới thiệu</Text>
          <Text style={styles.descriptionText}>
            {company?.description || 'Hiện chưa có thông tin giới thiệu chi tiết về doanh nghiệp này.'}
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => router.push({ pathname: '/nearby-jobs', params: { companyId: id } })}
        >
          <Ionicons name="search" size={20} color={COLORS.white} />
          <Text style={styles.actionBtnText}>Xem tất cả tin tuyển dụng</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOW.sm,
    marginBottom: SPACING.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  companyName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  companyIndustry: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    ...SHADOW.sm,
  },
  statNumber: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  infoSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.sm,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  infoLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
  },
  infoValue: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
  },
  descriptionText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOW.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default CompanyDetailScreen;
