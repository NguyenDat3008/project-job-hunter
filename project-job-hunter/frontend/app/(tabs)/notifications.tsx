// Notifications Tab - Redesigned to support single delete & clear-read
import { COLORS, SHADOW } from '@constants/theme';
import { notificationService } from '@services/notificationService';
import { NotificationGroup, NotificationItem } from '@/types/notification.types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
} from 'react-native';
import { LoadingSpinner, LoginRequired } from '@components/index';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '@store/authStore';

const getTimeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return `${Math.floor(diffDays / 30)} tháng trước`;
};

export default function NotificationsTab() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      const result = await notificationService.getNotifications({ page: 1, limit: 50 });
      setNotifications(result.data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications(true);
      // Mark all as read when entering the screen
      notificationService.markAllAsRead();
    }
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications(false);
  };

  const handlePress = async (notification: NotificationItem) => {
    // Đánh dấu đã đọc ngay lập tức
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    // Điều hướng dựa trên loại thông báo
    switch (notification.type) {
      case 'COMPANY_APPROVED':
        router.push('/company-rep/company-profile');
        break;
      case 'COMPANY_UPDATE_REQUEST':
        router.push('/admin/companies');
        break;
      case 'NEW_APPLICATION':
        if (notification.data?.jobId) {
          router.push(`/detail?jobId=${notification.data.jobId}`);
        } else {
          router.push('/hr/my-jobs');
        }
        break;
      case 'APPLICATION_STATUS':
      case 'JOB_ALERT':
        if (notification.data?.jobId) {
          router.push(`/detail?jobId=${notification.data.jobId}`);
        }
        break;
      default:
        // System notifications or unknown types
        if (notification.data?.url) {
          console.log('Open URL:', notification.data.url);
        }
        break;
    }
  };

  const handleDeleteSingle = (id: string, e: any) => {
    e.stopPropagation(); // Ngăn chặn sự kiện chạm thẻ mở chi tiết hoặc markRead
    Alert.alert(
      'Xóa thông báo',
      'Bạn có chắc chắn muốn xóa thông báo này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const success = await notificationService.deleteNotification(id);
            if (success) {
              setNotifications(prev => prev.filter(n => n.id !== id));
            } else {
              Alert.alert('Lỗi', 'Không thể xóa thông báo này.');
            }
          }
        }
      ]
    );
  };

  const handleCleanRead = () => {
    Alert.alert(
      'Xóa thông báo đã đọc',
      'Bạn có chắc chắn muốn xóa tất cả thông báo đã đọc khỏi danh sách?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            const success = await notificationService.deleteReadNotifications();
            if (success) {
              setNotifications(prev => prev.filter(n => !n.read));
              Alert.alert('Thành công', 'Đã xóa tất cả thông báo đã đọc.');
            } else {
              Alert.alert('Lỗi', 'Không thể dọn dẹp các thông báo.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <View style={[styles.notifWrapper, !item.read && styles.notifUnread]}>
      <TouchableOpacity
        style={styles.notifItem}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoBorder}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.companyLogo}
              resizeMode="contain"
            />
          </View>
        </View>
        <View style={styles.notifContent}>
          <Text style={styles.notifTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.notifBody} numberOfLines={3}>
            {item.body}
          </Text>
          <Text style={styles.notifTime}>
            {getTimeAgo(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={(e) => handleDeleteSingle(item.id, e)}
        activeOpacity={0.6}
      >
        <Ionicons name="trash-outline" size={18} color="#94A3B8" />
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) return <LoginRequired message="Bạn cần đăng nhập để xem thông báo" />;
  if (loading) {
    return <LoadingSpinner fullScreen message="Đang tải..." />;
  }

  const hasReadNotifications = notifications.some(n => n.read);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header matching premium spec */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Thông báo</Text>
        {hasReadNotifications ? (
          <TouchableOpacity style={styles.headerIcon} onPress={handleCleanRead} activeOpacity={0.7}>
            <Ionicons name="trash-bin-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>Không có thông báo nào</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: COLORS.white,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
  },
  headerSpacer: {
    width: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  headerIcon: {
    width: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  notifWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingRight: 8,
  },
  notifItem: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  notifUnread: {
    backgroundColor: '#F8FAFC', // Very light blue/gray tint
  },
  logoContainer: {
    marginRight: 14,
    paddingTop: 2,
  },
  logoBorder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  companyLogo: {
    width: '80%',
    height: '80%',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 18,
  },
  notifBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  deleteBtn: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
