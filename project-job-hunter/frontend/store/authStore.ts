// store/authStore.ts
// Zustand store - quản lý auth state toàn cục
// Access Token → SecureStore, User data → AsyncStorage
// Refresh Token → httpOnly Cookie (backend tự quản lý qua Set-Cookie)

import { create } from 'zustand';
import { AuthState, User } from '@/types/index';
import authService from '@services/authService';
import { secureStorage, generalStorage, STORAGE_KEYS } from '@utils/storage';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  restoreAuth: () => Promise<void>;
  refreshUserFromServer: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  restoreAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await secureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
      const user = await generalStorage.get<User>(STORAGE_KEYS.USER_DATA);

      if (token && user) {
        set({ token, user, isAuthenticated: true, isLoading: false, error: null });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error('[AuthStore] restoreAuth error:', e);
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authService.login({ username: email, password });
      console.log('[LOGIN] Full response:', JSON.stringify(response));
      const token = response.access_token;
      const loginUser = response.user;
      const user: User = {
        id: loginUser.id,
        email: loginUser.email,
        name: loginUser.name,
        role: loginUser.role,
        age: loginUser.age,
        gender: loginUser.gender,
        address: loginUser.address,
        skills: loginUser.skills,
        company: loginUser.company,
      };

      // Access Token → SecureStore
      // Refresh Token → httpOnly Cookie (backend tự set qua Set-Cookie header)
      await secureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, token);
      await generalStorage.set(STORAGE_KEYS.USER_DATA, user);

      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Đăng nhập thất bại';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  signup: async (email: string, password: string, name: string) => {
    try {
      set({ isLoading: true, error: null });
      await authService.register({ email, password, name });
      await get().login(email, password);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Đăng ký thất bại';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout();
    } catch (e) {
      console.warn('[AuthStore] logout API error (ignored):', e);
    } finally {
      // Xóa access token + user data
      // Refresh token cookie sẽ được backend xóa qua Set-Cookie maxAge=0
      await secureStorage.remove(STORAGE_KEYS.ACCESS_TOKEN);
      await generalStorage.remove(STORAGE_KEYS.USER_DATA);
      set({ user: null, token: null, isAuthenticated: false, error: null, isLoading: false });
    }
  },

  updateUser: (user: User) => {
    set({ user });
    generalStorage.set(STORAGE_KEYS.USER_DATA, user);
  },

  refreshUserFromServer: async () => {
    const { token } = get();
    if (!token) return;
    try {
      set({ isLoading: true });
      const response = await authService.getAccount();
      const user = response.user;
      set({ user, isAuthenticated: true, isLoading: false });
      await generalStorage.set(STORAGE_KEYS.USER_DATA, user);
    } catch (error) {
      console.error('[AuthStore] refreshUserFromServer error:', error);
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
