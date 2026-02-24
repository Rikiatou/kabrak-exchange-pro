import { create } from 'zustand';
import api from '../services/api';
import { fetchWithCache } from '../services/offlineCache';

const useDashboardStore = create((set) => ({
  data: null,
  isLoading: false,
  error: null,
  isOffline: false,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, fromCache } = await fetchWithCache('dashboard', async () => {
        const response = await api.get('/dashboard');
        return response.data.data;
      });
      set({ data, isLoading: false, isOffline: fromCache });
    } catch (error) {
      set({ error: error.message || 'Failed to load dashboard.', isLoading: false, isOffline: true });
    }
  }
}));

export default useDashboardStore;
