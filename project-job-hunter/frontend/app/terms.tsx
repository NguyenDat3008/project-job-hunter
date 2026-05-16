import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, SHADOW } from '@constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen options={{ 
        title: 'Điều khoản sử dụng',
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
      }} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.iconHeader}>
              <Ionicons name="document-text" size={40} color={COLORS.primary} />
              <Text style={styles.headerTitle}>Điều khoản & Điều kiện</Text>
            </View>
            <Text style={styles.text}>
              Bằng việc sử dụng ứng dụng Job Hunter, bạn đồng ý tuân thủ các điều khoản và điều kiện được quy định dưới đây.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Quyền và Nghĩa vụ</Text>
            <Text style={styles.text}>
              - Ứng viên cam kết cung cấp thông tin trung thực trong hồ sơ.{"\n"}
              - Nhà tuyển dụng cam kết đăng tin đúng sự thật và tuân thủ luật lao động.{"\n"}
              - Job Hunter có quyền tạm khóa tài khoản nếu phát hiện hành vi gian lận.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Giới hạn trách nhiệm</Text>
            <Text style={styles.text}>
              Chúng tôi cung cấp nền tảng kết nối và không chịu trách nhiệm trực tiếp về các thỏa thuận dân sự giữa ứng viên và nhà tuyển dụng.
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
    lineHeight: 26,
    textAlign: 'justify',
  },
});
