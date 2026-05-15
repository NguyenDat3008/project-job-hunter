export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  type?: 'JOB_ALERT' | 'SYSTEM' | 'APPLICATION' | 'NEW_APPLICATION' | 'APPLICATION_STATUS' | 'COMPANY_APPROVED' | 'COMPANY_UPDATE_REQUEST';
  data?: {
    jobId?: number | string;
    url?: string;
  };
}

export interface NotificationGroup {
  date: string;
  data: NotificationItem[];
}
