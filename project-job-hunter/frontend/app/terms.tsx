import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants/theme';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Điều khoản sử dụng' }} />
      <View style={styles.content}>
        <Text style={styles.title}>Quy định sử dụng</Text>
        <Text style={styles.text}>
          Khi sử dụng dịch vụ của TopCV, bạn đồng ý tuân thủ các quy định về việc cung cấp thông tin trung thực, không vi phạm pháp luật và không sử dụng nền tảng cho mục đích trái phép.
        </Text>
        <Text style={styles.text}>
          Chúng tôi có quyền tạm khóa hoặc xóa tài khoản nếu phát hiện các hành vi gian lận, spam hoặc vi phạm điều khoản nghiêm trọng mà không cần thông báo trước.
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
