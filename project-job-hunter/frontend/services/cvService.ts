// services/cvService.ts
// Kết nối với Spring Boot FileController + MinIO
// Upload CV file qua FormData → MinIO
// Dùng api wrapper (axios-based, auto-attach token)

import api from './api';
import { ENDPOINTS } from '@/constants/endpoints';

class CVService {
  /**
   * POST /api/v1/files
   * Upload file CV lên MinIO qua backend
   * @param file - { uri, name, type }
   * @returns filename trên server (MinIO path)
   */
  async uploadCV(file: { uri: string; name: string; type: string }): Promise<string> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
    // Có thể thêm folder param nếu backend hỗ trợ
    formData.append('folder', 'resume');

    const response = await api.upload<{ fileName: string }>(
      ENDPOINTS.FILES.UPLOAD,
      formData
    );
    // Backend trả về fileName hoặc url sau khi upload
    return typeof response === 'string' ? response : response?.fileName || '';
  }

  /**
   * GET /api/v1/files?fileName=...
   * Lấy URL tạm thời từ MinIO cho file
   */
  async getFileUrl(fileName: string): Promise<string> {
    const data = await api.get<string>(`/files?fileName=${encodeURIComponent(fileName)}`);
    return typeof data === 'string' ? data : '';
  }

  /**
   * GET /api/v1/cv/templates (mock-only endpoint hiện tại)
   */
  async getTemplates() {
    try {
      return await api.get(ENDPOINTS.CV.TEMPLATES);
    } catch {
      // Fallback mock data nếu endpoint chưa tồn tại
      return [
        {
          id: 'tpl-modern',
          name: 'Hiện đại',
          description: 'Mẫu thiết kế sạch sẽ, chuyên nghiệp',
          colors: ['#1a56db', '#057a55', '#c81e1e', '#1e293b'],
        },
        {
          id: 'tpl-classic',
          name: 'Truyền thống',
          description: 'Mẫu chuẩn cho các ngành nghề truyền thống',
          colors: ['#333333', '#1e3a8a', '#374151'],
        },
      ];
    }
  }

  /**
   * GET /api/v1/resumes/by-user
   * Lấy danh sách CV đã nộp của user
   */
  async getCVs() {
    try {
      const data = await api.get<any>('/resumes/by-user');
      if (Array.isArray(data)) {
        return { result: data, meta: { total: data.length, page: 1, pageSize: 10 } };
      }
      return data || { result: [], meta: { total: 0, page: 1, pageSize: 10 } };
    } catch {
      return { result: [], meta: { total: 0, page: 1, pageSize: 10 } };
    }
  }
}

export const cvService = new CVService();
