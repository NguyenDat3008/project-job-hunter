// services/api.ts
// Central API utility — dùng axios instance thay vì fetch
// Wrapper đơn giản để giữ tương thích với code cũ (companyService, resumeService, dashboard, register-company)

import apiClient from '@/lib/axiosInstance';
import { AxiosRequestConfig } from 'axios';

/**
 * API utility object — backward-compatible wrapper quanh axiosInstance.
 * Backend Spring Boot trả về: { statusCode, message, data }
 * Wrapper này tự động extract `data` từ response.
 */
const api = {
  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.get(path, config);
      const json = response.data;
      return (json?.data ?? json) as T;
    } catch (error: any) {
      if (__DEV__) {
        console.log(`[API GET ERROR] ${path}:`, error.response?.data || error.message);
      }
      throw error;
    }
  },

  async post<T>(path: string, body?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.post(path, body, config);
      const json = response.data;
      return (json?.data ?? json) as T;
    } catch (error: any) {
      if (__DEV__) {
        console.log(`[API POST ERROR] ${path}:`, error.response?.data || error.message);
      }
      throw error;
    }
  },

  async put<T>(path: string, body?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put(path, body, config);
    const json = response.data;
    return (json?.data ?? json) as T;
  },

  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete(path, config);
    const json = response.data;
    return (json?.data ?? json) as T;
  },

  /**
   * Upload file qua FormData (dùng cho MinIO upload)
   */
  async upload<T>(path: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post(path, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    const json = response.data;
    return (json?.data ?? json) as T;
  },
};

export default api;
