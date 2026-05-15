import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants/theme';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Giới thiệu về TopCV' }} />
      <View style={styles.content}>
        <Text style={styles.title}>Về chúng tôi</Text>
        <Text style={styles.text}>
          TopCV là nền tảng công nghệ tuyển dụng nhân sự hàng đầu Việt Nam. Chúng tôi kết nối hàng triệu ứng viên với các cơ hội việc làm tốt nhất từ các nhà tuyển dụng uy tín.
        </Text>
        <Text style={styles.text}>
          Với sứ mệnh "Nâng tầm lợi thế cạnh tranh", TopCV không ngừng nỗ lực mang đến những giải pháp toàn diện giúp ứng viên phát triển sự nghiệp và doanh nghiệp xây dựng đội ngũ vững mạnh.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.lg },
  title: { ...TYPOGRAPHY.h2, color: COLORS.primary, marginBottom: SPACING.md },
  text: { ...TYPOGRAPHY.body1, color: COLORS.text.primary, marginBottom: SPACING.md, lineHeight: 24 },
});
