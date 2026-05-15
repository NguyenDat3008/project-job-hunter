import { Header } from '@/components';
import { COLORS, SHADOW, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '@/store/authStore';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Check if user has administrative rights
  const isAdmin = user?.role?.name === 'ROLE_ADMIN' || user?.role?.name === 'ROLE_SUPER_ADMIN';
  const isHR = user?.role?.name === 'ROLE_HR';
  const canAccessAdmin = isAdmin || isHR;

  const SettingItem = ({ icon, label, onPress, color }: any) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color={color || COLORS.gray[500]} />
      </View>
      <Text style={[styles.label, color ? { color } : {}]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Cài đặt tài khoản" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Admin Dashboard Section - Only visible to Admin/HR */}
        {canAccessAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quản trị hệ thống ({user?.role?.name})</Text>
            <View style={styles.group}>
              {isAdmin && (
                <>
                  <SettingItem 
                    icon="business" 
                    label="Phê duyệt Công ty" 
                    color={COLORS.primary}
                    onPress={() => router.push('/admin/companies')} 
                  />
                  <View style={styles.divider} />
                </>
              )}
              <SettingItem 
                icon="document-attach" 
                label="Phê duyệt Hồ sơ (CV)" 
                color={COLORS.primary}
                onPress={() => router.push('/admin/resumes')} 
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt tài khoản</Text>
          <View style={styles.group}>
            <SettingItem icon="ribbon-outline" label="Nâng cấp tài khoản VIP" />
            <View style={styles.divider} />
            <SettingItem icon="key-outline" label="Đổi mật khẩu" />
            <View style={styles.divider} />
            <SettingItem icon="shield-outline" label="Cài đặt bảo mật" />
            <View style={styles.divider} />
            <SettingItem icon="checkmark-circle-outline" label="Xác minh 2 bước (Chưa kích hoạt)" />
            <View style={styles.divider} />
            <SettingItem icon="mail-outline" label="Cài đặt thông báo email" />
            <View style={styles.divider} />
            <SettingItem icon="close-circle-outline" label="Vô hiệu hóa tài khoản" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chính sách và hỗ trợ</Text>
          <View style={styles.group}>
            <SettingItem icon="business-outline" label="Về TopCV" />
            <View style={styles.divider} />
            <SettingItem icon="document-text-outline" label="Điều khoản dịch vụ" />
            <View style={styles.divider} />
            <SettingItem icon="shield-checkmark-outline" label="Chính sách bảo mật" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
    paddingLeft: 4,
  },
  group: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    ...SHADOW.sm,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconWrap: {
    marginRight: 16,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 54,
  },
});
