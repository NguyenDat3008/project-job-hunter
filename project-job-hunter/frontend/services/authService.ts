// services/authService.ts
// Kết nối với Spring Boot AuthController
// Endpoints: POST /auth/login, POST /auth/register, POST /auth/logout, GET /auth/account, GET /auth/refresh
// Dùng api wrapper (axios-based, auto-attach token)
// Refresh token được quản lý qua httpOnly Cookie — KHÔNG lưu trong app

import api from './api';
import { ENDPOINTS } from '@constants/endpoints';
import { LoginResponse, RegisterResponse, User } from '@/types/index';

const authService = {
  /**
   * POST /api/v1/auth/login
   * Body: { username: string, password: string }
   * Response: { access_token, user: { id, email, name, role, ... } }
   * Side-effect: Backend set refresh_token cookie (httpOnly)
   */
  login: async (credentials: {
    username: string;
    password: string;
  }): Promise<LoginResponse> => {
    return api.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, credentials);
  },

  /**
   * POST /api/v1/auth/register
   * Body: { email, password, name }
   * Tự động assign NORMAL_USER role
   */
  register: async (data: {
    email: string;
    password: string;
    name: string;
  }): Promise<RegisterResponse> => {
    return api.post<RegisterResponse>(ENDPOINTS.AUTH.REGISTER, data);
  },

  /**
   * POST /api/v1/auth/logout
   * Xóa refreshToken trong DB + xóa cookie
   * Token được tự động gắn bởi interceptor
   */
  logout: async (): Promise<void> => {
    await api.post(ENDPOINTS.AUTH.LOGOUT);
  },

  /**
   * GET /api/v1/auth/account
   * Trả về thông tin user đang login từ access token
   * Token được tự động gắn bởi interceptor
   */
  getAccount: async (): Promise<{ user: User }> => {
    return api.get<{ user: User }>(ENDPOINTS.AUTH.ACCOUNT);
  },

  /**
   * GET /api/v1/auth/refresh
   * Cookie refresh_token tự động đi kèm (withCredentials: true)
   * → issue accessToken mới
   */
  refreshToken: async (): Promise<LoginResponse> => {
    return api.get<LoginResponse>(ENDPOINTS.AUTH.REFRESH);
  },
};

export default authService;
