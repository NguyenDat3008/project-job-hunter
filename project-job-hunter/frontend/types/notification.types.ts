export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  type?: 'JOB_ALERT' | 'SYSTEM' | 'APPLICATION';
  data?: {
    jobId?: string;
    url?: string;
  };
}

export interface NotificationGroup {
  date: string;
  data: NotificationItem[];
}
