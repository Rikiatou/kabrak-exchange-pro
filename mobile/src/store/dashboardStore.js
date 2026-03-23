import { create } from 'zustand';
import api from '../services/api';

const useDashboardStore = create((set) => ({
  data: null,
  isLoading: false,
  error: null,
  isOffline: false,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null, data: null });
    try {
      const response = await api.get('/dashboard');
      set({ data: response.data.data, isLoading: false, isOffline: false });
    } catch (error) {
      set({ error: error.message || 'Failed to load dashboard.', isLoading: false, isOffline: true });
    }
  }
}));

export default useDashboardStore;
