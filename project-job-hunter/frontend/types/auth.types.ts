// Authentication types — mapped to Spring Boot backend

export type GenderEnum = 'MALE' | 'FEMALE' | 'OTHER';

export interface Role {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  apiPath: string;
  method: string;
  module: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  age?: number;
  gender?: GenderEnum;
  address?: string;
  profilePhoto?: string;
  company?: {
    id: number;
    name: string;
    logo?: string;
  };
  role?: Role;
  skills?: string[];
  createdAt: string;
  updatedAt?: string;
}

// Spring uses "username" field for login
export interface LoginRequest {
  username: string;
  password: string;
}

// Spring response: { access_token, user: { id, email, name, role } }
export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: Role;
  };
}

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  age?: number;
  gender?: GenderEnum;
  address?: string;
}

export interface SignUpResponse {
  id: number;
  email: string;
  name: string;
  age?: number;
  gender?: GenderEnum;
  address?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}