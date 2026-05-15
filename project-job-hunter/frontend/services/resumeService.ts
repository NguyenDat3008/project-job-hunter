// services/resumeService.ts
// Nhất quán: chỉ dùng api wrapper (axios-based), không mix apiClient trực tiếp
import api from './api';
import { Resume, ResumeStatus, PaginationResponse } from '@/types/index';
import { ENDPOINTS } from '@/constants/endpoints';

class ResumeService {
  async getResumes(page: number = 1, size: number = 10): Promise<PaginationResponse<Resume>> {
    return api.get<PaginationResponse<Resume>>(
      `${ENDPOINTS.RESUMES.LIST}?page=${page}&size=${size}`
    );
  }

  async getByUser(): Promise<Resume[]> {
    const data = await api.get<Resume[] | PaginationResponse<Resume>>(ENDPOINTS.RESUMES.LIST + '/by-user');
    if (Array.isArray(data)) return data;
    return (data as PaginationResponse<Resume>)?.result || [];
  }

  async updateStatus(id: number, status: ResumeStatus): Promise<Resume> {
    return api.put<Resume>(ENDPOINTS.RESUMES.UPDATE, { id, status });
  }

  async createResume(data: Partial<Resume>): Promise<Resume> {
    return api.post<Resume>(ENDPOINTS.RESUMES.CREATE, data);
  }
}

export const resumeService = new ResumeService();
