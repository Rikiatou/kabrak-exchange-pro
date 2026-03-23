import { create } from 'zustand';
import api from '../services/api';

const useRemittanceStore = create((set, get) => ({
  remittances: [],
  stats: null,
  loading: false,
  error: null,

  fetchRemittances: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const query = new URLSearchParams(params).toString();
      const res = await api.get(`/remittances${query ? `?${query}` : ''}`);
      set({ remittances: res.data.data, loading: false });
    } catch (e) {
      set({ loading: false, error: e.response?.data?.message || 'Erreur' });
    }
  },

  fetchStats: async () => {
    try {
      const res = await api.get('/remittances/stats');
      set({ stats: res.data.data });
    } catch {}
  },

  getOne: async (id) => {
    try {
      const res = await api.get(`/remittances/${id}`);
      return { success: true, data: res.data.data };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Erreur' };
    }
  },

  create: async (data) => {
    try {
      const res = await api.post('/remittances', data);
      await get().fetchRemittances();
      await get().fetchStats();
      return { success: true, data: res.data.data };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Erreur' };
    }
  },

  addPayment: async (id, data) => {
    try {
      const res = await api.post(`/remittances/${id}/payments`, data);
      await get().fetchRemittances();
      await get().fetchStats();
      return { success: true, data: res.data.data };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Erreur' };
    }
  },

  remove: async (id) => {
    try {
      await api.delete(`/remittances/${id}`);
      await get().fetchRemittances();
      await get().fetchStats();
      return { success: true };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Erreur' };
    }
  },
}));

export default useRemittanceStore;
