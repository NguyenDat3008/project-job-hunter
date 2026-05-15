// app/company-rep/hr-management.tsx
// Màn hình quản lý nhân sự HR trong công ty — Dành cho COMPANY_REPRESENTATIVE

import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import api from '@services/api';
import { useAuthStore } from '@store/authStore';
import LoadingSpinner from '@components/LoadingSpinner/LoadingSpinner';

interface HRMember {
  id: number;
  name: string;
  email: string;
  role: {
    name: string;
  };
}

export default function HRManagementScreen() {
  const { user } = useAuthStore();
  const [hrList, setHRList] = useState<HRMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newHREmail, setNewHREmail] = useState('');
  const [addingHR, setAddingHR] = useState(false);

  useEffect(() => {
    fetchHRList();
  }, []);

  const fetchHRList = async () => {
    if (!user?.company?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const response = await api.get(`/hr-management/${user?.company?.id}`) as any;
      
      const result = Array.isArray(response) ? response : (response?.result || []);
      setHRList(result);
    } catch (error) {
      console.error('Fetch HR error:', error);
      // Fallback: nếu lỗi do endpoint filter chưa chuẩn, lấy danh sách trống
      setHRList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddHR = async () => {
    if (!newHREmail) {
      Alert.alert('Lỗi', 'Vui lòng nhập email nhân viên.');
      return;
    }
    
    try {
      setAddingHR(true);
      // Backend expects: POST /api/v1/hr-management/{companyId} với body { email: "..." }
      await api.post(`/hr-management/${user?.company?.id}`, { email: newHREmail });
      
      Alert.alert('Thành công', `Đã thêm ${newHREmail} làm HR cho công ty.`);
      setModalVisible(false);
      setNewHREmail('');
      fetchHRList();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể thêm nhân viên. Email có thể không tồn tại hoặc đã thuộc công ty khác.');
    } finally {
      setAddingHR(false);
    }
  };

  const handleRemoveHR = (hr: HRMember) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn gỡ quyền HR của ${hr.name} (${hr.email}) khỏi công ty?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              // Giả định backend dùng DELETE để gỡ HR
              await api.delete(`/hr-management/${user?.company?.id}/${hr.id}`);
              setHRList(prev => prev.filter(item => item.id !== hr.id));
              Alert.alert('Thành công', 'Đã gỡ quyền nhân viên.');
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể gỡ quyền nhân viên.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: HRMember }) => (
    <View style={styles.hrCard}>
      <View style={styles.hrAvatar}>
        <Text style={styles.hrAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.hrInfo}>
        <Text style={styles.hrName}>{item.name}</Text>
        <Text style={styles.hrEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveHR(item)}>
        <Ionicons name="person-remove-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Quản lý nhân sự HR' }} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>{user?.company?.name || 'Công ty của bạn'}</Text>
          <Text style={styles.hrCount}>{hrList.length} nhân viên HR</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={COLORS.white} />
          <Text style={styles.addBtnText}>Thêm HR</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={hrList}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              fetchHRList();
            }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={COLORS.border} />
              <Text style={styles.emptyText}>Công ty chưa có nhân viên HR nào.</Text>
            </View>
          }
        />
      )}

      {/* Modal thêm HR */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm nhân viên HR</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalLabel}>Email người dùng *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="nhanvien@example.com"
              value={newHREmail}
              onChangeText={setNewHREmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={styles.modalHint}>
              Người dùng này phải đã có tài khoản trên hệ thống.
            </Text>

            <TouchableOpacity 
              style={[styles.modalSubmitBtn, addingHR && { opacity: 0.7 }]}
              onPress={handleAddHR}
              disabled={addingHR}
            >
              <Text style={styles.modalSubmitBtnText}>
                {addingHR ? 'Đang xử lý...' : 'Thêm ngay'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  companyName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
  },
  hrCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 4,
    ...SHADOW.sm,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    padding: SPACING.md,
  },
  hrCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW.sm,
  },
  hrAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  hrAvatarText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: '800',
  },
  hrInfo: {
    flex: 1,
  },
  hrName: {
    ...TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  hrEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  removeBtn: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
  },
  modalLabel: {
    ...TYPOGRAPHY.body2,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
  },
  modalHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: 8,
    marginBottom: SPACING.lg,
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
