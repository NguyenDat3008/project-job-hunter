import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, SHADOW } from '@constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen options={{ 
        title: 'Giới thiệu về TopCV',
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
      }} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBanner}>
          <Ionicons name="business" size={60} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Job Hunter</Text>
          <Text style={styles.headerSubtitle}>Nâng tầm lợi thế cạnh tranh</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Về chúng tôi</Text>
            <Text style={styles.text}>
              TopCV là nền tảng công nghệ tuyển dụng nhân sự hàng đầu Việt Nam. Chúng tôi kết nối hàng triệu ứng viên với các cơ hội việc làm tốt nhất từ các nhà tuyển dụng uy tín.
            </Text>
            <Text style={styles.text}>
              Với sứ mệnh "Nâng tầm lợi thế cạnh tranh", TopCV không ngừng nỗ lực mang đến những giải pháp toàn diện giúp ứng viên phát triển sự nghiệp và doanh nghiệp xây dựng đội ngũ vững mạnh.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Giá trị cốt lõi</Text>
            <View style={styles.valueItem}>
              <Ionicons name="rocket" size={24} color={COLORS.primary} />
              <View style={styles.valueTextWrap}>
                <Text style={styles.valueTitle}>Sáng tạo</Text>
                <Text style={styles.valueDesc}>Luôn tiên phong trong các giải pháp công nghệ tuyển dụng.</Text>
              </View>
            </View>
            <View style={styles.valueItem}>
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <View style={styles.valueTextWrap}>
                <Text style={styles.valueTitle}>Tận tâm</Text>
                <Text style={styles.valueDesc}>Đặt lợi ích của ứng viên và nhà tuyển dụng lên hàng đầu.</Text>
              </View>
            </View>
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
  headerBanner: {
    backgroundColor: COLORS.white,
    paddingVertical: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...SHADOW.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    marginTop: 16,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  content: { padding: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: 12,
    fontWeight: '800',
  },
  text: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary,
    marginBottom: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  valueTextWrap: { flex: 1 },
  valueTitle: { fontWeight: '700', color: COLORS.text.primary, fontSize: 16 },
  valueDesc: { color: COLORS.text.secondary, fontSize: 13, marginTop: 2 },
});
