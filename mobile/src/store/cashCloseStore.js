import { create } from 'zustand';
import api from '../services/api';

const useCashCloseStore = create((set) => ({
  closes: [],
  todaySummary: null,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/cash-close');
      set({ closes: res.data.data, loading: false });
    } catch (e) {
      set({ loading: false, error: e.response?.data?.message || 'Erreur' });
    }
  },

  fetchToday: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/cash-close/today');
      set({ todaySummary: res.data.data, loading: false });
    } catch (e) {
      set({ loading: false, error: e.response?.data?.message || 'Erreur' });
    }
  },

  closeDay: async (data) => {
    try {
      const res = await api.post('/cash-close', data);
      return { success: true, data: res.data.data };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Erreur' };
    }
  },
}));

export default useCashCloseStore;
