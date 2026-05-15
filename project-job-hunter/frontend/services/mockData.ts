export const MOCK_CURRENT_USER = {
  id: 1,
  name: 'Nguyễn Văn A',
  email: 'nguyenvana@example.com',
  skills: ['React Native', 'TypeScript', 'Node.js', 'UI/UX Design', 'SQL'],
  avatar: 'https://i.pravatar.cc/150?u=1',
};

export const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Công việc mới phù hợp với bạn',
    body: 'Vị trí Senior React Native Developer tại FPT Software đang tìm kiếm ứng viên có kỹ năng của bạn.',
    read: false,
    createdAt: new Date().toISOString(),
    type: 'JOB_ALERT',
    data: { jobId: '1' }
  },
  {
    id: '2',
    title: 'Hồ sơ của bạn đã được xem',
    body: 'HR từ công ty VNG đã xem hồ sơ của bạn cho vị trí Frontend Developer.',
    read: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    type: 'APPLICATION',
  }
];
