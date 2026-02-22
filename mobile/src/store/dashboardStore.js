import { create } from 'zustand';
import api from '../services/api';

const useDashboardStore = create((set) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/dashboard');
      set({ data: response.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to load dashboard.', isLoading: false });
    }
  }
}));

export default useDashboardStore;
