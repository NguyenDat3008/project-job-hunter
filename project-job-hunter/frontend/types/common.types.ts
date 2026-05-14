// Common types — mapped to Spring Boot RestResponse format

// Spring RestResponse wrapper: { statusCode, error, message, data }
export interface ApiResponse<T> {
  statusCode: number;
  error?: string;
  message?: string;
  data?: T;
}

// Spring ResultPaginationDTO
export interface PaginationResponse<T> {
  meta: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  result: T[];
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormError {
  [key: string]: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface PaginationParams {
  page: number;
  size: number; // Spring uses "size"
  sort?: string;
}

export interface StorageData {
  key: string;
  value: unknown;
  expiresAt?: number;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  isError: boolean;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}