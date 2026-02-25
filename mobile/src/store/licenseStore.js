import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const LICENSE_KEY = 'kabrak_license_key';
const LICENSE_DATA_KEY = 'kabrak_license_data';

const useLicenseStore = create((set, get) => ({
  licenseKey: null,
  licenseData: null,
  isValid: false,
  isChecking: false,
  error: null,

  loadStoredLicense: async () => {
    try {
      const key = await AsyncStorage.getItem(LICENSE_KEY);
      const dataStr = await AsyncStorage.getItem(LICENSE_DATA_KEY);
      if (key && dataStr) {
        const data = JSON.parse(dataStr);
        set({ licenseKey: key, licenseData: data, isValid: true });
      }
    } catch {}
  },

  verifyLicense: async (licenseKey) => {
    set({ isChecking: true, error: null });
    try {
      const res = await api.post('/licenses/verify', { licenseKey });
      const data = res.data.data;
      await AsyncStorage.setItem(LICENSE_KEY, licenseKey);
      await AsyncStorage.setItem(LICENSE_DATA_KEY, JSON.stringify(data));
      set({ licenseKey, licenseData: data, isValid: true, isChecking: false, error: null });
      return { success: true, data };
    } catch (e) {
      const code = e.response?.data?.code;
      const message = e.response?.data?.message || 'License verification failed.';
      set({ isValid: false, isChecking: false, error: { code, message } });
      return { success: false, code, message };
    }
  },

  clearLicense: async () => {
    await AsyncStorage.removeItem(LICENSE_KEY);
    await AsyncStorage.removeItem(LICENSE_DATA_KEY);
    set({ licenseKey: null, licenseData: null, isValid: false, error: null });
  },

  fetchMyLicense: async () => {
    try {
      const res = await api.get('/licenses/my');
      const data = res.data.data;
      if (data && data.licenseKey) {
        await AsyncStorage.setItem(LICENSE_KEY, data.licenseKey);
        await AsyncStorage.setItem(LICENSE_DATA_KEY, JSON.stringify(data));
        set({ licenseKey: data.licenseKey, licenseData: data, isValid: data.active !== false, error: null });
        return { success: true, data };
      }
      return { success: false };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || e.message };
    }
  },

  checkOnline: async () => {
    const { licenseKey } = get();
    if (!licenseKey) return false;
    try {
      const res = await api.post('/licenses/verify', { licenseKey });
      const data = res.data.data;
      await AsyncStorage.setItem(LICENSE_DATA_KEY, JSON.stringify(data));
      set({ licenseData: data, isValid: true, error: null });
      return true;
    } catch (e) {
      const code = e.response?.data?.code;
      if (code === 'EXPIRED' || code === 'SUSPENDED') {
        set({ isValid: false, error: { code, message: e.response?.data?.message } });
        return false;
      }
      return true;
    }
  }
}));

export default useLicenseStore;
