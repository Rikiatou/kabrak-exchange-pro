import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
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
    set({ user: null, token: null, isAuthenticated: false, expoPushToken: null });
  },

  loadUser: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;
      const response = await api.get('/auth/me');
      set({ user: response.data.data, token, isAuthenticated: true });
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        set({ expoPushToken: pushToken });
        api.put('/auth/push-token', { expoPushToken: pushToken }).catch(() => {});
      }
    } catch {
      await SecureStore.deleteItemAsync('auth_token');
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
