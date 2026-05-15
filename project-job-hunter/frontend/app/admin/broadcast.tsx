import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '@services/notificationService';
import { SafeAreaView } from 'react-native-safe-area-context';

const BroadcastScreen = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [roleName, setRoleName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const roles = [
    { label: 'Tất cả người dùng', value: undefined },
    { label: 'Ứng viên (Normal User)', value: 'NORMAL_USER' },
    { label: 'Nhà tuyển dụng (HR)', value: 'COMPANY_REPRESENTATIVE' },
  ];

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tiêu đề và nội dung.');
      return;
    }

    Alert.alert(
      'Xác nhận gửi',
      `Bạn có chắc chắn muốn gửi thông báo này tới ${roleName ? roleName : 'tất cả người dùng'}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi ngay',
          onPress: async () => {
            setLoading(true);
            const success = await notificationService.broadcastNotification(title, body, roleName);
            setLoading(false);
            if (success) {
              Alert.alert('Thành công', 'Thông báo đã được gửi tới toàn hệ thống.');
              router.back();
            } else {
              Alert.alert('Lỗi', 'Không thể gửi thông báo. Vui lòng thử lại sau.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerTitle: 'Thông báo hệ thống',
          headerTintColor: COLORS.text.primary,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerInfo}>
          <Ionicons name="megaphone-outline" size={48} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Gửi thông báo toàn hệ thống</Text>
          <Text style={styles.headerSubtitle}>Thông báo sẽ được gửi tới hòm thư của người dùng ngay lập tức.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Đối tượng nhận</Text>
          <View style={styles.roleContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={String(role.value)}
                style={[
                  styles.roleButton,
                  roleName === role.value && styles.roleButtonActive,
                ]}
                onPress={() => setRoleName(role.value)}
              >
                <Text
                  style={[
                    styles.roleText,
                    roleName === role.value && styles.roleTextActive,
                  ]}
                >
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Tiêu đề</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tiêu đề thông báo..."
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={COLORS.text.tertiary}
          />

          <Text style={styles.label}>Nội dung</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nhập nội dung chi tiết..."
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            placeholderTextColor={COLORS.text.tertiary}
          />

          <TouchableOpacity
            style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="send" size={20} color={COLORS.white} />
                <Text style={styles.sendBtnText}>Gửi thông báo ngay</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    marginTop: SPACING.sm,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  label: {
    ...TYPOGRAPHY.body1,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  roleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  roleTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    height: 120,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xl,
    ...SHADOW.md,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  sendBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default BroadcastScreen;
