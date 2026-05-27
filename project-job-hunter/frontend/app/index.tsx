import { Redirect } from 'expo-router';
import { useAuthStore } from '@store/authStore';
import { LoadingSpinner } from '@components/index';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore(); // Lấy trạng thái từ Store lưu trữ

  if (isLoading) {
    return <LoadingSpinner fullScreen />;// Nếu đang trong quá trình khôi phục đăng nhập, hiện màn hình tải
  }

  return isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;// Nếu đã đăng nhập -> vào (tabs) ngược lại đăng nhập
}