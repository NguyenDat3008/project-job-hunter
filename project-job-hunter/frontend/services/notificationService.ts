// services/notificationService.ts
// Kết nối với Spring Boot NotificationController
// Dùng api wrapper (axios-based, auto-attach token)

import api from './api';
import { ENDPOINTS } from '@constants/endpoints';
import { NotificationItem } from '../types/notification.types';

class NotificationService {
  /**
   * GET /api/v1/notifications
   * Lấy danh sách thông báo — Cần Token
   */
  async getNotifications(params: { page: number; limit: number }) {
    try {
      const response = await api.get<any>(
        `${ENDPOINTS.NOTIFICATIONS.LIST}?page=${params.page}&size=${params.limit}`
      );
      
      // Backend returns RestResponse.data which is an array
      const rawList = Array.isArray(response) ? response : (response?.result || []);
      
      const mappedData: NotificationItem[] = rawList.map((item: any) => {
        let parsedData = null;
        if (item.data && typeof item.data === 'string') {
          try {
            parsedData = JSON.parse(item.data);
          } catch (e) {
            console.warn('Failed to parse notification data:', item.data);
          }
        } else {
          parsedData = item.data;
        }

        return {
          id: String(item.id),
          title: item.title || 'Thông báo',
          body: item.body || '',
          read: item.read ?? item.isRead ?? false,
          createdAt: item.createdAt,
          type: item.type,
          data: parsedData
        };
      });

      return {
        data: mappedData,
        meta: response?.meta || { total: mappedData.length, page: params.page, limit: params.limit },
      };
    } catch (error) {
      console.error('[NotificationService] getNotifications error:', error);
      return {
        data: [] as NotificationItem[],
        meta: { total: 0, page: params.page, limit: params.limit },
      };
    }
  }

  /**
   * PUT /api/v1/notifications/{id}/read
   * Đánh dấu đã đọc — Cần Token
   */
  async markAsRead(id: string) {
    try {
      await api.post(ENDPOINTS.NOTIFICATIONS.MARK_READ(Number(id)));
    } catch (error) {
      console.error('[NotificationService] markAsRead error:', error);
    }
  }

  /**
   * PUT /api/v1/notifications/read-all
   * Đánh dấu tất cả đã đọc
   */
  async markAllAsRead() {
    try {
      await api.post(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    } catch (error) {
      console.error('[NotificationService] markAllAsRead error:', error);
    }
  }

  /**
   * POST /api/v1/notifications/broadcast
   * Admin gửi thông báo toàn hệ thống
   */
  async broadcastNotification(title: string, body: string, roleName?: string) {
    try {
      await api.post(ENDPOINTS.NOTIFICATIONS.BROADCAST, {
        title,
        body,
        roleName
      });
      return true;
    } catch (error) {
      console.error('[NotificationService] broadcastNotification error:', error);
      return false;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const data = await api.get<number>(ENDPOINTS.NOTIFICATIONS.COUNT_UNREAD);
      return typeof data === 'number' ? data : 0;
    } catch {
      return 0;
    }
  }

  /**
   * DELETE /api/v1/notifications/{id}
   * Xóa một thông báo cụ thể
   */
  async deleteNotification(id: string): Promise<boolean> {
    try {
      await api.delete(ENDPOINTS.NOTIFICATIONS.DELETE(Number(id)));
      return true;
    } catch (error) {
      console.error('[NotificationService] deleteNotification error:', error);
      return false;
    }
  }

  /**
   * DELETE /api/v1/notifications/read
   * Xóa tất cả các thông báo đã đọc
   */
  async deleteReadNotifications(): Promise<boolean> {
    try {
      await api.delete(ENDPOINTS.NOTIFICATIONS.CLEAN_READ);
      return true;
    } catch (error) {
      console.error('[NotificationService] deleteReadNotifications error:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
