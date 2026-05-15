import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY } from '@constants/theme';

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Chính sách bảo mật' }} />
      <View style={styles.content}>
        <Text style={styles.title}>Bảo vệ dữ liệu của bạn</Text>
        <Text style={styles.text}>
          Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân của người dùng. Mọi dữ liệu về hồ sơ, liên hệ và lịch sử ứng tuyển đều được mã hóa và bảo vệ nghiêm ngặt.
        </Text>
        <Text style={styles.text}>
          TopCV chỉ chia sẻ thông tin của bạn với nhà tuyển dụng khi có sự đồng ý rõ ràng thông qua việc ứng tuyển hoặc bật trạng thái tìm việc.
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
