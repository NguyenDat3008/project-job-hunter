// services/companyService.ts
// Kết nối với Spring Boot CompanyController
// Dùng api wrapper (axios-based)

import api from './api';
import { Company, Job, PaginationResponse } from '@/types/index';
import { ENDPOINTS } from '@/constants/endpoints';

class CompanyService {
  /**
   * GET /api/v1/companies?page=...&size=...
   */
  async getCompanies(page: number = 1, size: number = 10): Promise<PaginationResponse<Company>> {
    return api.get<PaginationResponse<Company>>(
      `${ENDPOINTS.COMPANIES.LIST}?page=${page}&size=${size}`
    );
  }

  /**
   * GET /api/v1/companies/:id
   */
  async getCompanyDetail(id: number): Promise<Company> {
    return api.get<Company>(ENDPOINTS.COMPANIES.DETAIL(id));
  }

  /**
   * GET /api/v1/jobs?filter=company.id:'companyId'
   * Lấy danh sách job của công ty
   */
  async getCompanyJobs(companyId: number): Promise<Job[]> {
    const result = await api.get<PaginationResponse<Job>>(
      `${ENDPOINTS.JOBS.LIST}?filter=company.id:'${companyId}'&size=50`
    );
    return result?.result || [];
  }

  /**
   * PUT /api/v1/companies
   * Update status or other info
   */
  async updateStatus(id: number, active: boolean): Promise<Company> {
    return api.put<Company>(ENDPOINTS.COMPANIES.UPDATE, { id, active });
  }

  /**
   * POST /api/v1/companies
   * Tạo công ty mới
   */
  async createCompany(data: Partial<Company>): Promise<Company> {
    return api.post<Company>(ENDPOINTS.COMPANIES.CREATE, data);
  }
}

export const companyService = new CompanyService();
