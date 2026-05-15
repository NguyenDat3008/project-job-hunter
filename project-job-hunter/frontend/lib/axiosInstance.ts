// lib/axiosInstance.ts
// Central Axios instance với interceptors:
// - Request: tự động gắn Bearer token từ SecureStore
// - Response: tự động refresh token khi 401, xử lý lỗi toàn cục
//
// Chiến lược Refresh Token:
// - Backend gửi refresh_token qua httpOnly Cookie (Set-Cookie header)
// - withCredentials: true để browser/RN tự gửi cookie kèm mọi request
// - Khi 401 → gọi GET /auth/refresh (cookie tự động đi kèm)
// - Nếu refresh fail → clear tokens, user cần login lại

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { API_CONFIG } from '@constants/endpoints';
import { secureStorage, STORAGE_KEYS } from '@utils/storage';

// ─── Create Axios Instance ───────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}`,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  // QUAN TRỌNG: cho phép gửi/nhận cookies tự động (refresh_token httpOnly)
  withCredentials: true,
});

// ─── Flag để tránh loop refresh token ─────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// ─── Request Interceptor — tự động gắn token ─────────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const token = await secureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — xử lý lỗi + auto refresh token ───────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError): Promise<any> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 Unauthorized — thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Đợi refresh hoàn tất rồi retry
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi refresh endpoint — dùng axios instance MỚI để tránh interceptor loop
        // withCredentials: true → browser/RN tự gửi cookie refresh_token
        const refreshResponse = await axios.get(
          `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}/auth/refresh`,
          { withCredentials: true }
        );

        const responseData = refreshResponse.data?.data ?? refreshResponse.data;
        const newAccessToken = responseData?.access_token;

        if (newAccessToken) {
          // Lưu access token mới
          await secureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
          processQueue(null, newAccessToken);

          // Retry original request với token mới
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          throw new Error('Failed to refresh token — no access_token in response');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear access token — user cần login lại
        await secureStorage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Parse error message từ backend cho dễ đọc
    if (error.response?.data) {
      const backendData = error.response.data as any;
      const message = backendData?.message || backendData?.error || error.message;
      error.message = message;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
