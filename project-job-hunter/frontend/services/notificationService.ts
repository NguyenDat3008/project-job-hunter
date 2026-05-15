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
      const data = await api.get<any>(
        `${ENDPOINTS.NOTIFICATIONS.LIST}?page=${params.page}&size=${params.limit}`
      );
      // Backend có thể trả PaginationResponse hoặc array
      if (Array.isArray(data)) {
        return {
          data: data as NotificationItem[],
          meta: { total: data.length, page: params.page, limit: params.limit },
        };
      }
      return {
        data: (data?.result || []) as NotificationItem[],
        meta: data?.meta || { total: 0, page: params.page, limit: params.limit },
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
   * GET /api/v1/notifications/unread
   * Đếm số thông báo chưa đọc
   */
  async getUnreadCount(): Promise<number> {
    try {
      const data = await api.get<number>(ENDPOINTS.NOTIFICATIONS.COUNT_UNREAD);
      return typeof data === 'number' ? data : 0;
    } catch {
      return 0;
    }
  }
}

export const notificationService = new NotificationService();
