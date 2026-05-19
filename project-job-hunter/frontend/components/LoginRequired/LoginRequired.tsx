import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOW } from '@constants/theme';

interface LoginRequiredProps {
  message?: string;
  icon?: string;
}

export default function LoginRequired({ 
  message = 'Vui lòng đăng nhập để sử dụng tính năng này',
  icon = 'lock-closed-outline'
}: LoginRequiredProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon as any} size={64} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>Bạn chưa đăng nhập</Text>
      <Text style={styles.message}>{message}</Text>
      
      <TouchableOpacity 
        style={styles.loginBtn}
        onPress={() => router.push('/login')}
      >
        <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.backBtnText}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOW.md,
    marginBottom: 16,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    paddingVertical: 12,
  },
  backBtnText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
