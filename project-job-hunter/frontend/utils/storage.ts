// utils/storage.ts
// Tiện ích lưu trữ: SecureStore cho tokens nhạy cảm, AsyncStorage cho dữ liệu thường
// Compatible với Expo SDK 55

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Secure Storage (cho access_token, refresh_token) ─────────────────────────
// SecureStore chỉ hoạt động trên iOS/Android, fallback sang AsyncStorage trên web

const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      if (isNativePlatform) {
        return await SecureStore.getItemAsync(key);
      }
      // Fallback cho web
      return await AsyncStorage.getItem(`secure_${key}`);
    } catch (error) {
      console.error(`[SecureStorage] Error getting ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      if (isNativePlatform) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(`secure_${key}`, value);
      }
    } catch (error) {
      console.error(`[SecureStorage] Error setting ${key}:`, error);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      if (isNativePlatform) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(`secure_${key}`);
      }
    } catch (error) {
      console.error(`[SecureStorage] Error removing ${key}:`, error);
    }
  },
};

// ─── General Storage (cho user info, settings, cache) ─────────────────────────

export const generalStorage = {
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[GeneralStorage] Error getting ${key}:`, error);
      return null;
    }
  },

  async set<T = any>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[GeneralStorage] Error setting ${key}:`, error);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[GeneralStorage] Error removing ${key}:`, error);
    }
  },

  async getString(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`[GeneralStorage] Error getting string ${key}:`, error);
      return null;
    }
  },

  async setString(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`[GeneralStorage] Error setting string ${key}:`, error);
    }
  },
};

// ─── Storage Keys Constants ───────────────────────────────────────────────────

export const STORAGE_KEYS = {
  // SecureStore keys (tokens)
  ACCESS_TOKEN: 'auth_access_token',
  // REFRESH_TOKEN không cần lưu — backend quản lý qua httpOnly Cookie

  // AsyncStorage keys (user data, settings)
  USER_DATA: 'auth_user_data',
  SETTINGS: 'app_settings',
  SEARCH_HISTORY: 'search_history',
  CACHED_JOBS: 'cached_jobs',
} as const;

// ─── Legacy-compatible storage object (cho AuthContext) ───────────────────────

export const storage = {
  async getSecure(key: string): Promise<string | null> {
    return secureStorage.get(key);
  },
  async setSecure(key: string, value: string): Promise<void> {
    return secureStorage.set(key, value);
  },
  async removeSecure(key: string): Promise<void> {
    return secureStorage.remove(key);
  },
  async get<T = any>(key: string): Promise<T | null> {
    return generalStorage.get<T>(key);
  },
  async set<T = any>(key: string, value: T): Promise<void> {
    return generalStorage.set<T>(key, value);
  },
  async remove(key: string): Promise<void> {
    return generalStorage.remove(key);
  },
};

export default storage;
