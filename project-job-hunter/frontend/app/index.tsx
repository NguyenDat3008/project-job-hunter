import { Redirect } from 'expo-router';
import { useAuthStore } from '@store/authStore';
import { LoadingSpinner } from '@components/index';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}