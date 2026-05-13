// Storage utility with SecureStore support
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { StorageData } from '@/types/index';

const PREFIX = '@topcv:';

export const storage = {
  // Regular storage (AsyncStorage)
  async set(key: string, value: string | object | number | boolean, expiresAt?: number) {
    try {
      const data: StorageData = {
        key,
        value,
        expiresAt,
      };
      await AsyncStorage.setItem(PREFIX + key, JSON.stringify(data));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  async get(key: string) {
    try {
      const data = await AsyncStorage.getItem(PREFIX + key);
      if (!data) return null;

      const parsed = JSON.parse(data) as StorageData;

      // Check expiration
      if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
        await this.remove(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async remove(key: string) {
    try {
      await AsyncStorage.removeItem(PREFIX + key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },

  // Secure storage (SecureStore)
  async setSecure(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(PREFIX + key, value);
    } catch (error) {
      console.error('SecureStorage set error:', error);
    }
  },

  async getSecure(key: string) {
    try {
      return await SecureStore.getItemAsync(PREFIX + key);
    } catch (error) {
      console.error('SecureStorage get error:', error);
      return null;
    }
  },

  async removeSecure(key: string) {
    try {
      await SecureStore.deleteItemAsync(PREFIX + key);
    } catch (error) {
      console.error('SecureStorage remove error:', error);
    }
  },

  async clear() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefixedKeys = keys.filter((key: string) => key.startsWith(PREFIX));
      await AsyncStorage.multiRemove(prefixedKeys);
      
      // Note: SecureStore doesn't have a clear all, need to remove specific keys
      // Usually tokens are the only things in secure store
      await this.removeSecure('authToken');
      await this.removeSecure('refreshToken');
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },

  async getAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefixedKeys = keys.filter((key: string) => key.startsWith(PREFIX));
      const items = await AsyncStorage.multiGet(prefixedKeys);
      
      const result: Record<string, any> = {};
      items.forEach(([key, value]: readonly [string, string | null]) => {
        if (value) {
          const cleanKey = key.replace(PREFIX, '');
          result[cleanKey] = JSON.parse(value).value;
        }
      });
      return result;
    } catch (error) {
      console.error('Storage getAll error:', error);
      return {};
    }
  },
};

export default storage;