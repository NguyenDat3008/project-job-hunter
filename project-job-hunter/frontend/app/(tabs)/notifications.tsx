// Notifications Tab - Matching example6.jpg exactly
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
} from 'react-native';
import { LoadingSpinner } from '@components/index';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const result = await notificationService.getNotifications({ page: 1, limit: 50 });
      setNotifications(result.data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
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
          // Xử lý mở URL nếu có (ví dụ link bài viết)
          console.log('Open URL:', notification.data.url);
        }
        break;
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.notifItem, !item.read && styles.notifUnread]}
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
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Đang tải..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header matching Example 6 */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Thông báo</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="list" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
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
            <Text style={styles.emptyText}>Không có thông báo nào</Text>
          </View>
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
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  headerIcon: {
    width: 24,
    alignItems: 'flex-end',
  },
  listContent: {
    flexGrow: 1,
  },
  notifItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
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
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
