import { create } from 'zustand';
import api from '../services/api';

const useDepositStore = create((set, get) => ({
  deposits: [],
  loading: false,
  error: null,

  fetchDeposits: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const query = new URLSearchParams(params).toString();
      const res = await api.get(`/deposits${query ? `?${query}` : ''}`);
      set({ deposits: res.data.data, loading: false });
    } catch (e) {
      set({ loading: false, error: e.response?.data?.message || 'Error' });
    }
  },

  createDeposit: async (data) => {
    try {
      const res = await api.post('/deposits', data);
      await get().fetchDeposits();
      return { success: true, data: res.data.data };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Error' };
    }
  },

  confirmDeposit: async (id) => {
    try {
      await api.put(`/deposits/${id}/confirm`);
      await get().fetchDeposits();
      return { success: true };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Error' };
    }
  },

  rejectDeposit: async (id) => {
    try {
      await api.put(`/deposits/${id}/reject`);
      await get().fetchDeposits();
      return { success: true };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Error' };
    }
  },
}));

export default useDepositStore;
