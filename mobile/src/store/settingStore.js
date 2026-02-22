import { create } from 'zustand';
import api from '../services/api';

const useSettingStore = create((set) => ({
  settings: {
    businessName: 'KABRAK Exchange Pro',
    businessPhone: '',
    businessAddress: '',
    businessEmail: '',
  },
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/settings');
      if (res.data.success) set({ settings: res.data.data });
    } catch (_) {}
    set({ isLoading: false });
  },

  updateSettings: async (data) => {
    try {
      const res = await api.put('/settings', data);
      if (res.data.success) {
        set({ settings: res.data.data });
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Erreur' };
    }
  },
}));

export default useSettingStore;
