// context/AuthContext.tsx
// Auth Context — LEGACY, giữ lại cho backward compatibility
// ⚠️ App hiện dùng useAuthStore (Zustand) làm state management chính
// File này KHÔNG được mount trong _layout.tsx
// Nếu cần dùng auth, hãy import useAuth từ @hooks/index thay vì AuthContext
//
// Token strategy: access_token → SecureStore, refresh_token → httpOnly Cookie

import { AuthState, User } from '@/types/index';
import authService from '@services/authService';
import { storage, STORAGE_KEYS } from '@utils/storage';
import React, { createContext, ReactNode, useEffect, useState } from 'react';

export interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Restore auth state on app startup
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const token = await storage.getSecure(STORAGE_KEYS.ACCESS_TOKEN);
        const user = await storage.get<User>(STORAGE_KEYS.USER_DATA);

        if (token && user) {
          setState(prev => ({
            ...prev,
            token: token as string,
            user: user as User,
            isAuthenticated: true,
            isLoading: false,
          }));
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('[AuthContext] Error restoring auth:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    restoreAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Spring expects "username" field
      const response = await authService.login({
        username: email,
        password,
      });

      const token = response.access_token;
      const loginUser = response.user;

      const fullUser: User = {
        id: loginUser.id,
        email: loginUser.email,
        name: loginUser.name,
        role: loginUser.role,
        createdAt: new Date().toISOString(),
      };

      // Access token → SecureStore
      // Refresh token → httpOnly Cookie (backend tự xử lý)
      await storage.setSecure(STORAGE_KEYS.ACCESS_TOKEN, token);
      await storage.set(STORAGE_KEYS.USER_DATA, fullUser);

      setState(prev => ({
        ...prev,
        user: fullUser,
        token,
        isAuthenticated: true,
        error: null,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Đăng nhập thất bại';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      await authService.register({ email, password, name });

      // Auto login after signup
      await login(email, password);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Đăng ký thất bại';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await authService.logout();
    } catch (error) {
      console.warn('[AuthContext] Logout API error (ignored):', error);
    } finally {
      await storage.removeSecure(STORAGE_KEYS.ACCESS_TOKEN);
      await storage.remove(STORAGE_KEYS.USER_DATA);

      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
      });
    }
  };

  const updateUser = (user: User) => {
    setState(prev => ({ ...prev, user }));
    storage.set(STORAGE_KEYS.USER_DATA, user);
  };

  const value: AuthContextType = {
    state,
    login,
    signup,
    logout,
    updateUser,
    isLoading: state.isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;