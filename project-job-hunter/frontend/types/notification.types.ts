// Notification types

export type NotificationType =
  | 'JOB_MATCH'        // AI tìm thấy việc phù hợp
  | 'APPLICATION_UPDATE' // Đơn ứng tuyển được cập nhật
  | 'PREMIUM_EXPIRE'    // Gói Premium sắp hết hạn
  | 'COMPANY_VIEW'      // Nhà tuyển dụng xem CV
  | 'NEW_JOB'           // Công ty theo dõi đăng việc mới
  | 'SYSTEM';           // Thông báo hệ thống

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data?: {
    jobId?: number;
    companyId?: number;
    applicationId?: number;
    url?: string;
  };
  icon?: string;
}

export interface NotificationGroup {
  label: string; // "Hôm nay", "Hôm qua", "Tuần trước"
  items: NotificationItem[];
}
