// services/jobService.ts
// Kết nối với Spring Boot JobController + ResumeController
// Dùng api wrapper (axios-based, auto-attach token, auto-refresh)

import api from './api';
import { ENDPOINTS } from '@constants/endpoints';
import { Job, Resume, PaginationResponse } from '@/types/index';

export const jobService = {
  /**
   * GET /api/v1/jobs?page=1&size=20&filter=...
   * Public endpoint — không cần token
   */
  getJobs: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginationResponse<Job>> => {
    const page = params.page ?? 1;
    const size = params.limit ?? 20;
    const queryParams: string[] = [`page=${page}`, `size=${size}`];
    if (params.search) {
      queryParams.push(`filter=name~'${params.search}'`);
    }
    return api.get<PaginationResponse<Job>>(
      `${ENDPOINTS.JOBS.LIST}?${queryParams.join('&')}`
    );
  },

  /**
   * GET /api/v1/jobs?page=1&size={limit}&sort=createdAt,desc
   * Lấy danh sách job mới nhất
   */
  getLatestJobs: async (limit: number = 10): Promise<Job[]> => {
    const data = await api.get<PaginationResponse<Job>>(
      `${ENDPOINTS.JOBS.LIST}?page=1&size=${limit}&sort=createdAt,desc`
    );
    return data?.result || [];
  },

  /**
   * GET /api/v1/jobs/{id}
   */
  getJobById: async (id: number): Promise<Job> => {
    return api.get<Job>(ENDPOINTS.JOBS.DETAIL(id));
  },

  /**
   * Alias cho getJobById — dùng bởi detail.tsx
   */
  getJobDetail: async (id: number): Promise<Job> => {
    return jobService.getJobById(id);
  },

  /**
   * POST /api/v1/jobs/{id}/save
   * Toggle lưu/bỏ lưu job — Cần Token
   */
  saveJob: async (id: number): Promise<void> => {
    await api.post(ENDPOINTS.SAVED_JOBS.TOGGLE(id));
  },

  /**
   * POST /api/v1/jobs/{id}/save (toggle — gọi lại để unsave)
   */
  unsaveJob: async (id: number): Promise<void> => {
    await api.post(ENDPOINTS.SAVED_JOBS.TOGGLE(id));
  },

  /**
   * GET /api/v1/saved-jobs
   * Danh sách việc đã lưu — Cần Token
   */
  getSavedJobs: async (): Promise<Job[]> => {
    const data = await api.get<Job[] | PaginationResponse<Job>>(ENDPOINTS.SAVED_JOBS.LIST);
    // Backend có thể trả PaginationResponse hoặc array trực tiếp
    if (Array.isArray(data)) return data;
    return (data as PaginationResponse<Job>)?.result || [];
  },

  /**
   * GET /api/v1/jobs/recommend
   * Gợi ý công việc bằng AI — Cần Token
   */
  getRecommendedJobs: async (): Promise<PaginationResponse<Job>> => {
    return api.get<PaginationResponse<Job>>(ENDPOINTS.RECOMMENDATIONS.LIST);
  },

  /**
   * POST /api/v1/resumes
   * Nộp đơn ứng tuyển — Cần Token
   * Body: { email, url, user: { id }, job: { id } }
   */
  applyJob: async (data: {
    jobId: number;
    email: string;
    url: string;
    userId?: number;
    location?: string;
    coverLetter?: string;
  }): Promise<Resume> => {
    const payload = {
      email: data.email,
      url: data.url,
      user: data.userId ? { id: data.userId } : undefined,
      job: { id: data.jobId },
      // Optional fields for detailed application
      location: data.location,
      coverLetter: data.coverLetter,
    };
    return api.post<Resume>(ENDPOINTS.RESUMES.CREATE, payload);
  },

  /**
   * GET /api/v1/resumes/by-user
   * Lấy danh sách đơn ứng tuyển của user hiện tại — Cần Token
   */
  getApplications: async (): Promise<Resume[]> => {
    const data = await api.get<Resume[] | PaginationResponse<Resume>>('/resumes/by-user');
    if (Array.isArray(data)) return data;
    return (data as PaginationResponse<Resume>)?.result || [];
  },

  /**
   * Tìm kiếm cơ bản bằng từ khóa (Không dùng AI)
   */
  basicSearch: async (params: {
    query: string;
    location?: string;
    level?: string;
  }): Promise<PaginationResponse<Job>> => {
    let filter = `name ~ '*${params.query}*' or description ~ '*${params.query}*'`;
    
    // Thêm các bộ lọc nếu có
    if (params.location && params.location !== 'Toàn quốc') {
      filter = `(${filter}) and location ~ '*${params.location}*'`;
    }
    if (params.level && params.level !== 'Tất cả cấp bậc') {
      filter = `(${filter}) and level = '${params.level}'`;
    }

    return api.get<PaginationResponse<Job>>(`/jobs?page=1&size=50&filter=${encodeURIComponent(filter)}&sort=createdAt,desc`);
  },
};

export default jobService;
