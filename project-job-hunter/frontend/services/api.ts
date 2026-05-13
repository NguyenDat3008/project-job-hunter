// Base API instance configuration
import { API_CONFIG, ENDPOINTS } from '@constants/endpoints';
import { storage } from '@utils/storage';
import { ApiError } from '@/types/index';
import { Logger } from '@utils/logger';
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

class APIClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    onSuccess: (token: string) => void;
    onFailed: (error: AxiosError) => void;
  }> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}`,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await storage.getSecure('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        Logger.log('API Request:', config.url, { method: config.method });
        return config;
      },
      (error: any) => {
        Logger.error('Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: any) => {
        Logger.log('API Response:', response.config.url, {
          status: response.status,
        });
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({
                onSuccess: (token: string) => {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  resolve(this.axiosInstance(originalRequest));
                },
                onFailed: (err) => {
                  reject(err);
                },
              });
            });
          }

          this.isRefreshing = true;
          originalRequest._retry = true;

          try {
            const refreshToken = await storage.getSecure('refreshToken');
            if (refreshToken) {
              const response = await axios.post(
                `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}${ENDPOINTS.AUTH.REFRESH_TOKEN}`,
                { refreshToken }
              );

              const { token } = response.data;
              await storage.setSecure('authToken', token);

              this.failedQueue.forEach((prom) => prom.onSuccess(token));
              this.failedQueue = [];

              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (err) {
            this.failedQueue.forEach((prom) => prom.onFailed(err as AxiosError));
            this.failedQueue = [];
            await storage.removeSecure('authToken');
            await storage.removeSecure('refreshToken');
          } finally {
            this.isRefreshing = false;
          }
        }

        Logger.error('Response Error:', error.response?.data || error.message);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    const errorData = error.response?.data as any;

    return {
      code: errorData?.code || error.code || 'UNKNOWN_ERROR',
      message:
        errorData?.message || error.message || 'An error occurred',
      statusCode: error.response?.status || 500,
      details: errorData?.details,
      timestamp: new Date().toISOString(),
    };
  }

  get<T>(url: string, config?: any) {
    return this.axiosInstance.get<T>(url, config);
  }

  post<T>(url: string, data?: any, config?: any) {
    return this.axiosInstance.post<T>(url, data, config);
  }

  put<T>(url: string, data?: any, config?: any) {
    return this.axiosInstance.put<T>(url, data, config);
  }

  patch<T>(url: string, data?: any, config?: any) {
    return this.axiosInstance.patch<T>(url, data, config);
  }

  delete<T>(url: string, config?: any) {
    return this.axiosInstance.delete<T>(url, config);
  }

  getInstance() {
    return this.axiosInstance;
  }
}

export const api = new APIClient();

export default api;