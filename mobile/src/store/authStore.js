import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { registerForPushNotifications } from '../utils/pushNotifications';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  expoPushToken: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, refreshToken, user } = response.data.data;
      await SecureStore.setItemAsync('auth_token', token);
      if (refreshToken) await SecureStore.setItemAsync('refresh_token', refreshToken);
      await SecureStore.setItemAsync('cached_user', JSON.stringify(user));
      // Clear stale offline cache from any previous session/account
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(k => k.startsWith('offline_cache_'));
      if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
      set({ user, token, isAuthenticated: true, isLoading: false });
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        set({ expoPushToken: pushToken });
        api.put('/auth/push-token', { expoPushToken: pushToken }).catch(() => {});
      }
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: error.response?.data?.message || 'Login failed.' };
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('cached_user');
    await AsyncStorage.removeItem('hasSeenWelcome');
    // Clear all offline cache to prevent cross-account data leaks
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(k => k.startsWith('offline_cache_'));
    if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
    set({ user: null, token: null, isAuthenticated: false, expoPushToken: null });
  },

  loadUser: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      // One-time cache wipe for this code version (removes stale cross-account cache)
      const cacheVersion = await AsyncStorage.getItem('cache_version');
      if (cacheVersion !== 'v2') {
        const allKeys = await AsyncStorage.getAllKeys();
        const staleKeys = allKeys.filter(k => k.startsWith('offline_cache_'));
        if (staleKeys.length > 0) await AsyncStorage.multiRemove(staleKeys);
        await AsyncStorage.setItem('cache_version', 'v2');
      }

      const token = await SecureStore.getItemAsync('auth_token');
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      
      if (!token && !refreshToken) { set({ isLoading: false }); return; }

      // If cached user + token exists, restore session immediately
      if (token) {
        const cachedUser = await SecureStore.getItemAsync('cached_user');
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          // Clear offline cache if userId changed (different account)
          const lastUserId = await AsyncStorage.getItem('last_user_id');
          if (lastUserId && lastUserId !== String(parsed.id)) {
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter(k => k.startsWith('offline_cache_'));
            if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
          }
          await AsyncStorage.setItem('last_user_id', String(parsed.id));
          set({ user: parsed, token, isAuthenticated: true, isLoading: false });
          get().setupPushNotifications().catch(() => {});
          return;
        }
        // No cache — try /me to get user
        try {
          const response = await api.get('/auth/me');
          const user = response.data.data;
          await SecureStore.setItemAsync('cached_user', JSON.stringify(user));
          set({ user, token, isAuthenticated: true, isLoading: false });
          get().setupPushNotifications().catch(() => {});
          return;
        } catch (error) {
          const status = error.response?.status;
          if (status !== 401 && status !== 403) {
            set({ isLoading: false });
            return;
          }
        }
      }
      
      // Try refresh token
      if (refreshToken) {
        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { token: newToken, refreshToken: newRefreshToken, user } = response.data.data;
          
          await SecureStore.setItemAsync('auth_token', newToken);
          if (newRefreshToken) await SecureStore.setItemAsync('refresh_token', newRefreshToken);
          
          await SecureStore.setItemAsync('cached_user', JSON.stringify(user));
          set({ user, token: newToken, isAuthenticated: true, isLoading: false });
          await get().setupPushNotifications();
          return;
        } catch (refreshError) {
          const status = refreshError.response?.status;
          if (status !== 401 && status !== 403) {
            // Network error - keep tokens
            console.log('Network error on refresh, keeping tokens');
            set({ isLoading: false });
            return;
          }
          console.log('Refresh token invalid, clearing tokens');
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('refresh_token');
          await SecureStore.deleteItemAsync('cached_user');
        }
      }
    } catch (error) {
      console.log('Load user error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setupPushNotifications: async () => {
    const pushToken = await registerForPushNotifications();
    if (pushToken) {
      set({ expoPushToken: pushToken });
      api.put('/auth/push-token', { expoPushToken: pushToken }).catch(() => {});
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to change password.' };
    }
  }
}));

export default useAuthStore;
