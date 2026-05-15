// ─── Core Domain Types (mirroring Spring Boot backend DTOs) ──────────────────

export interface Role {
  id: number;
  name: string;
  description?: string;
  active?: boolean;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  apiPath: string;
  method: string;
  module: string;
}

// Matches ResLoginDTO.UserLogin from backend
export interface User {
  id: number;
  email: string;
  name: string;
  role?: Role;
  phone?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  skills?: string[];
  createdAt?: string;
  avatar?: string;
  company?: {
    id: number;
    name: string;
    logo?: string;
    isPremium?: boolean;
    premiumTier?: string;
  };
}

// ─── Auth State ───────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ─── API Response wrappers (Spring Boot standard response) ────────────────────

export interface ApiResponse<T> {
  statusCode: number;
  error?: string;
  message: string;
  data: T;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pages: number;
  total: number;
}

export interface PaginationResponse<T> {
  meta: PaginationMeta;
  result: T[];
}

// ─── Auth DTO (matches backend ResLoginDTO) ───────────────────────────────────

export interface LoginResponse {
  access_token: string; // @JsonProperty("access_token") in backend
  user: {
    id: number;
    email: string;
    name: string;
    role?: Role;
    phone?: string;
    age?: number;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    address?: string;
    skills?: string[];
    company?: {
      id: number;
      name: string;
      logo?: string;
      isPremium?: boolean;
      premiumTier?: string;
    };
  };
}

export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  address?: string;
  createdAt?: string;
}

// ─── Utility Types ────────────────────────────────────────────────────────────

export interface LoadingState {
  isLoading: boolean;
  isError: boolean;
  error?: string | null;
}

export interface ApiError {
  statusCode?: number;
  message: string;
  error?: string;
}

// Re-export domain-specific types from sub-modules
export * from './job.types';
export * from './notification.types';
