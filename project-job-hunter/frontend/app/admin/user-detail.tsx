import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '@services/api';
import { ENDPOINTS } from '@constants/endpoints';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserStats {
  totalResumes: number;
}

const UserDetailScreen = () => {
  const { id, userData } = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData) {
      setUser(JSON.parse(userData as string));
    }
    fetchStats();
  }, [id]);

  const fetchStats = async () => {
    try {
      const response = await api.get(`${ENDPOINTS.STATISTICS.USER}?id=${id}`);
      setStats(response as any);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
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
          headerTitle: 'Chi tiết người dùng',
          headerTintColor: COLORS.text.primary,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.name || 'USER'}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.totalResumes || 0}</Text>
            <Text style={styles.statLabel}>CV đã nộp</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user?.age || '--'}</Text>
            <Text style={styles.statLabel}>Tuổi</Text>
          </View>
        </View>

        {/* Info List */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color={COLORS.text.secondary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Địa chỉ</Text>
              <Text style={styles.infoValue}>{user?.address || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="transgender-outline" size={20} color={COLORS.text.secondary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Giới tính</Text>
              <Text style={styles.infoValue}>{user?.gender === 'MALE' ? 'Nam' : user?.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</Text>
            </View>
          </View>

          {user?.company && (
            <View style={styles.infoItem}>
              <Ionicons name="business-outline" size={20} color={COLORS.text.secondary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Công ty</Text>
                <Text style={styles.infoValue}>{user.company.name}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.text.secondary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Ngày tham gia</Text>
              <Text style={styles.infoValue}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '---'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => Alert.alert('Thông báo', 'Tính năng nhắn tin đang được phát triển.')}
          >
            <Ionicons name="mail-outline" size={20} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Gửi tin nhắn</Text>
          </TouchableOpacity>
        </View>
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
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    fontWeight: '800',
  },
  userName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  roleBadge: {
    backgroundColor: COLORS.secondaryLight || '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  roleText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondary || '#0EA5E9',
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
    marginBottom: SPACING.xl,
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
  actions: {
    marginBottom: SPACING.xl,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOW.md,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default UserDetailScreen;
