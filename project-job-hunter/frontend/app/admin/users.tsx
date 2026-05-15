// app/admin/users.tsx
// Màn hình quản lý người dùng — chỉ SUPER_ADMIN/ADMIN
// Xem danh sách users, tìm kiếm, xem chi tiết

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import api from '@services/api';
import { ENDPOINTS } from '@constants/endpoints';
import { User, PaginationResponse } from '@/types/index';

const GENDER_LABEL: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = useCallback(async (searchTerm = '') => {
    try {
      const params: Record<string, string> = { page: '1', size: '50' };
      if (searchTerm.trim()) {
        params.filter = `name~'${searchTerm}'`;
      }
      const data = await api.get<PaginationResponse<User>>(
        `${ENDPOINTS.USERS.LIST}?${new URLSearchParams(params).toString()}`
      );
      const result = Array.isArray(data) ? data : data?.result || [];
      setUsers(result);
      setTotalUsers((data as any)?.meta?.total || result.length);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa tài khoản "${user.name}"?\nHành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(ENDPOINTS.USERS.DELETE(user.id));
              setUsers(prev => prev.filter(u => u.id !== user.id));
              setTotalUsers(prev => prev - 1);
            } catch {
              Alert.alert('Lỗi', 'Không thể xóa người dùng.');
            }
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (roleName?: string) => {
    switch (roleName) {
      case 'SUPER_ADMIN': return { bg: '#FDE8E8', text: '#9B1C1C' };
      case 'COMPANY_REPRESENTATIVE': return { bg: '#E8F5FF', text: '#1C3E9B' };
      case 'HR': return { bg: '#E8F0FE', text: '#1A56DB' };
      default: return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const renderItem = ({ item }: { item: User }) => {
    const badge = getRoleBadgeColor(item.role?.name);
    return (
      <View style={styles.card}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{(item.name || 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.roleText, { color: badge.text }]}>
                {item.role?.name || 'USER'}
              </Text>
            </View>
          </View>
          <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
          <View style={styles.meta}>
            {item.gender && (
              <Text style={styles.metaText}>{GENDER_LABEL[item.gender] || item.gender}</Text>
            )}
            {item.age && <Text style={styles.metaText}>{item.age} tuổi</Text>}
            {item.company?.name && (
              <View style={styles.companyTag}>
                <Ionicons name="business-outline" size={10} color={COLORS.primary} />
                <Text style={styles.companyTagText} numberOfLines={1}>{item.company.name}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteUser(item)}>
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Quản lý Người dùng',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: COLORS.white },
        }}
      />

      {/* Stats */}
      <View style={styles.statsBar}>
        <Ionicons name="people" size={18} color={COLORS.primary} />
        <Text style={styles.statsText}>Tổng: <Text style={styles.statsNum}>{totalUsers}</Text> người dùng</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={COLORS.text.secondary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm theo tên..."
          placeholderTextColor={COLORS.text.light}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchUsers(search); }}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Không tìm thấy người dùng</Text>
              <Text style={styles.emptyText}>Thử tìm kiếm với từ khóa khác.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.secondary },
  list: { padding: SPACING.md },

  statsBar: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statsText: { ...TYPOGRAPHY.body2, color: COLORS.text.secondary },
  statsNum: { fontWeight: '700', color: COLORS.primary },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    marginBottom: 0,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  searchInput: { flex: 1, ...TYPOGRAPHY.body1, color: COLORS.text.primary },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHADOW.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { ...TYPOGRAPHY.h3, color: COLORS.primary, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  name: { ...TYPOGRAPHY.body1, fontWeight: '700', color: COLORS.text.primary, flex: 1 },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleText: { fontSize: 9, fontWeight: '700' },
  email: { ...TYPOGRAPHY.caption, color: COLORS.text.secondary, marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaText: { ...TYPOGRAPHY.caption, color: COLORS.text.light },
  companyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 140,
  },
  companyTagText: { ...TYPOGRAPHY.caption, color: COLORS.primary, fontSize: 10 },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FDE8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.text.primary, marginTop: 16, marginBottom: 8 },
  emptyText: { ...TYPOGRAPHY.body2, color: COLORS.text.secondary, textAlign: 'center' },
});
