import { create } from 'zustand';
import { AuthState, User, LoginResponse } from '@/types/index';
import authService from '@services/authService';
import { storage } from '@utils/storage';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  restoreAuth: () => Promise<void>;
  refreshUserFromServer: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setError: (error) => set({ error }),

  restoreAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await storage.getSecure('authToken');
      const user = await storage.get('user');

      console.log('DEBUG RESTORE AUTH:', { hasToken: !!token, hasUser: !!user });

      if (token && user) {
        set({
          token: token as string,
          user: user as User,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error restoring auth:', error);
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authService.login({
        username: email,
        password,
      });

      console.log('DEBUG LOGIN RESPONSE:', response);

      const token = response.access_token;
      const refreshToken = response.refresh_token;
      const loginUser = response.user;

      // Build full user object from real API data
      // Backend ResLoginDTO.UserLogin includes: id, email, name, role, age, gender, address, skills
      const fullUser: User = {
        id: loginUser.id,
        email: loginUser.email,
        name: loginUser.name,
        role: loginUser.role,
        age: (loginUser as any).age,
        gender: (loginUser as any).gender,
        address: (loginUser as any).address,
        skills: (loginUser as any).skills,
        createdAt: new Date().toISOString(),
      };

      await storage.setSecure('authToken', token);
      if (refreshToken) {
        await storage.setSecure('refreshToken', refreshToken);
      }
      await storage.set('user', fullUser);
      
      console.log('DEBUG STORAGE SAVED:', { token: token?.substring(0, 20), user: fullUser });

      set({
        user: fullUser,
        token,
        isAuthenticated: true,
        error: null,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('DEBUG LOGIN ERROR:', error);
      const errorMessage = error?.message || 'Đăng nhập thất bại';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  signup: async (email: string, password: string, name: string) => {
    try {
      set({ isLoading: true, error: null });
      await authService.register({ email, password, name });
      // Auto login after signup
      await get().login(email, password);
    } catch (error: any) {
      const errorMessage = error?.message || 'Đăng ký thất bại';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await storage.removeSecure('authToken');
      await storage.removeSecure('refreshToken');
      await storage.remove('user');

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
      });
    }
  },

  updateUser: (user: User) => {
    set({ user });
    storage.set('user', user);
  },

  // Fetch fresh user data from server (GET /auth/account)
  refreshUserFromServer: async () => {
    try {
      const freshUser = await authService.getCurrentUser();
      if (freshUser) {
        const currentUser = get().user;
        const mergedUser: User = {
          ...currentUser,
          ...freshUser,
          // Keep fields that account endpoint might not return
          createdAt: currentUser?.createdAt || new Date().toISOString(),
        };
        set({ user: mergedUser });
        await storage.set('user', mergedUser);
      }
    } catch (error) {
      console.error('Error refreshing user from server:', error);
    }
  },
}));
