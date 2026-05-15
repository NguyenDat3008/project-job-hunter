import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '@services/api';
import { ENDPOINTS } from '@constants/endpoints';
import LoadingSpinner from '@components/LoadingSpinner/LoadingSpinner';

interface Company {
  id: number;
  name: string;
  address: string;
  active: boolean;
  createdAt: string;
}

const AdminDashboard = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingCompanies = async () => {
    try {
      // Gọi API lấy danh sách công ty, lọc active = false ở frontend 
      // hoặc nếu backend có filter thì dùng filter
      const response = await api.get(ENDPOINTS.COMPANIES.LIST, {
        params: { size: 100 }
      });
      const allCompanies = response as any;
      const companiesArray = Array.isArray(allCompanies) ? allCompanies : (allCompanies?.result || []);
      const pending = companiesArray.filter((c: Company) => !c.active);
      setCompanies(pending);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tải danh sách công ty chờ duyệt.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Check permission
    const checkPermission = async () => {
      try {
        const response = await api.get(ENDPOINTS.PROFILE.GET) as any;
        const userRole = response?.user?.role?.name;
        if (userRole !== 'SUPER_ADMIN') {
          Alert.alert('Lỗi', 'Bạn không có quyền truy cập trang này.');
          router.replace('/(tabs)');
        } else {
          fetchPendingCompanies();
        }
      } catch (error) {
        router.replace('/');
      }
    };
    checkPermission();
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
              await api.put(ENDPOINTS.COMPANIES.UPDATE, {
                ...company,
                active: true,
              });
              Alert.alert('Thành công', 'Công ty đã được kích hoạt trên hệ thống.');
              fetchPendingCompanies();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể phê duyệt công ty.');
            }
          },
        },
      ]
    );
  };

  const renderCompanyItem = ({ item }: { item: Company }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{item.name}</Text>
          <Text style={styles.companyAddress}>{item.address}</Text>
          <Text style={styles.dateText}>Ngày gửi: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
        </View>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={() => handleApprove(item)}
        >
          <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
          <Text style={styles.approveBtnText}>Duyệt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Quản trị hệ thống',
          headerTintColor: COLORS.text.primary,
        }}
      />
      
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{companies.length}</Text>
          <Text style={styles.statLabel}>Chờ duyệt</Text>
        </View>
        <TouchableOpacity 
          style={[styles.statBox, { backgroundColor: COLORS.secondaryLight || '#E0F2FE' }]}
          onPress={() => router.push('/admin/broadcast' as any)}
        >
          <Ionicons name="megaphone" size={32} color={COLORS.secondary || '#0EA5E9'} />
          <Text style={[styles.statLabel, { color: COLORS.secondary || '#0EA5E9' }]}>Gửi thông báo</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Danh sách công ty đăng ký mới</Text>

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
              fetchPendingCompanies();
            }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cafe-outline" size={60} color={COLORS.border} />
              <Text style={styles.emptyText}>Hiện không có công ty nào chờ duyệt.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
  },
  statNumber: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  companyName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  companyAddress: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
  },
  approveBtn: {
    backgroundColor: COLORS.success || '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.sm,
  },
  approveBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 12,
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
});

export default AdminDashboard;
