import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, SHADOW } from '@constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen options={{ 
        title: 'Chính sách bảo mật',
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
      }} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.iconHeader}>
              <Ionicons name="shield-checkmark" size={40} color={COLORS.success} />
              <Text style={styles.headerTitle}>Cam kết bảo mật</Text>
            </View>
            <Text style={styles.text}>
              Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn một cách tuyệt đối. Mọi dữ liệu bạn cung cấp đều được mã hóa và xử lý theo các tiêu chuẩn an toàn cao nhất.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>1. Thông tin chúng tôi thu thập</Text>
            <Text style={styles.text}>
              Chúng tôi thu thập các thông tin cần thiết để cung cấp dịch vụ tốt nhất cho bạn, bao gồm: Họ tên, Email, Số điện thoại và Hồ sơ cá nhân (CV).
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>2. Cách chúng tôi sử dụng thông tin</Text>
            <Text style={styles.text}>
              Thông tin của bạn được sử dụng để kết nối bạn với nhà tuyển dụng phù hợp, gửi thông báo việc làm mới và cải thiện trải nghiệm người dùng trên hệ thống.
            </Text>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  content: { padding: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconHeader: { alignItems: 'center', marginBottom: 20 },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.text.primary, marginTop: 12 },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    marginBottom: 12,
    fontWeight: '800',
  },
  text: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    lineHeight: 24,
    textAlign: 'justify',
  },
});
