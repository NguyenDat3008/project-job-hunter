import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, useColorScheme, View, Alert } from 'react-native';
import 'react-native-reanimated';
import { useAuthStore } from '../store/authStore';
import { Toast } from '../components/Toast';
import { useToastStore } from '../store/toastStore';

// === GLOBAL MONKEY-PATCH FOR Alert.alert ===
const originalAlert = Alert.alert;

Alert.alert = (title, message, buttons, options) => {
  // 1. If it's a confirmation dialog (has 2 or more buttons), preserve native Alert
  if (buttons && buttons.length > 1) {
    return originalAlert(title, message, buttons, options);
  }

  // 2. Classify notification type based on content keywords
  const textToCheck = `${title || ''} ${message || ''}`.toLowerCase();
  let type: 'success' | 'error' | 'warning' | 'info' = 'info';

  if (
    textToCheck.includes('thành công') ||
    textToCheck.includes('hoàn tất') ||
    textToCheck.includes('đã lưu') ||
    textToCheck.includes('gửi thành công') ||
    textToCheck.includes('đăng tin') ||
    textToCheck.includes('nộp cv') ||
    textToCheck.includes('đăng ký thành công')
  ) {
    type = 'success';
  } else if (
    textToCheck.includes('lỗi') ||
    textToCheck.includes('thất bại') ||
    textToCheck.includes('không thể') ||
    textToCheck.includes('sai') ||
    textToCheck.includes('chưa nhập') ||
    textToCheck.includes('thiếu') ||
    textToCheck.includes('yêu cầu')
  ) {
    type = 'error';
  } else if (
    textToCheck.includes('cảnh báo') ||
    textToCheck.includes('chú ý') ||
    textToCheck.includes('vui lòng')
  ) {
    type = 'warning';
  }

  const mainMessage = message || title || '';

  // 3. Show Toast notification
  useToastStore.getState().show(mainMessage, type);

  // 4. If the single button has an onPress handler (e.g. navigation or callback), trigger it automatically
  if (buttons && buttons[0] && buttons[0].onPress) {
    setTimeout(() => {
      buttons[0].onPress?.();
    }, 1200); // 1.2s delay to let user read the toast first
  }
};


export const unstable_settings = {
  anchor: '(tabs)', // Chỉ định nhóm tab điều hướng dưới đáy làm mốc mỏ neo chính khi tải ứng dụng
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { restoreAuth, isLoading } = useAuthStore();

  useEffect(() => {
    restoreAuth(); // Lấy Token cũ lưu trong máy để tự đăng nhập lại cho người dùng
  }, []);


  const appContent = (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="detail" options={{ headerShown: false }} />
        <Stack.Screen name="report" options={{ headerShown: false }} />
        <Stack.Screen name="company-detail" options={{ headerShown: false }} />
        <Stack.Screen name="premium" options={{ headerShown: true, title: 'Gói Premium', headerBackTitle: 'Đóng' }} />
        <Stack.Screen name="saved-jobs" options={{ headerShown: false }} />
        <Stack.Screen name="profile-edit" options={{ headerShown: false }} />
        <Stack.Screen name="cv-builder" options={{ headerShown: false }} />
        <Stack.Screen name="upload-cv" options={{ headerShown: false }} />
        <Stack.Screen name="account-settings" options={{ headerShown: false }} />
        <Stack.Screen name="register-company" options={{ headerShown: true, headerBackTitle: 'Quay lại' }} />

        <Stack.Screen name="admin/dashboard" options={{ headerShown: true, headerBackTitle: 'Quay lại' }} />
        <Stack.Screen name="admin/companies" options={{ headerShown: true, headerBackTitle: 'Quay lại' }} />
        <Stack.Screen name="admin/resumes" options={{ headerShown: true, headerBackTitle: 'Quay lại' }} />
        <Stack.Screen name="admin/users" options={{ headerShown: true, headerBackTitle: 'Quay lại' }} />
        <Stack.Screen name="admin/reported-jobs" options={{ headerShown: true, headerBackTitle: 'Quay lại' }} />

        {/* HR screens */}
        <Stack.Screen name="hr/job-form" options={{ headerShown: true, headerBackTitle: 'Quay lại' }} />
        <Stack.Screen name="hr/my-jobs" options={{ headerShown: true, headerBackTitle: 'Quay lại' }} />

        {/* Company Representative screens */}
        <Stack.Screen name="company-rep/hr-management" options={{ headerShown: true, headerBackTitle: 'Quay lại' }} />
      </Stack>
      <StatusBar style="auto" />
      <Toast />
    </ThemeProvider>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <View style={styles.mobileWrapper}>
          {appContent}
        </View>
      </View>
    );
  }

  return appContent;
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileWrapper: {
    width: '100%',
    maxWidth: 428,
    height: '100%',
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
});
