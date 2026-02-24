import { create } from 'zustand';
import api from '../services/api';
import { fetchWithCache } from '../services/offlineCache';

const useReportStore = create((set) => ({
  profitData: null,
  monthlyData: null,
  isLoading: false,
  error: null,

  fetchProfitReport: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await fetchWithCache(`profit_${params.period || 'monthly'}`, async () => {
        const response = await api.get('/reports/profit', { params });
        return response.data.data;
      });
      set({ profitData: data, isLoading: false });
      return { success: true, data };
    } catch (error) {
      set({ error: error.message || 'Failed to load profit report.', isLoading: false });
      return { success: false };
    }
  },

  fetchMonthlyReport: async (params = {}) => {
    try {
      const response = await api.get('/reports/monthly', { params });
      set({ monthlyData: response.data.data });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
}));

export default useReportStore;
