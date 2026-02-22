import { create } from 'zustand';
import api from '../services/api';

const usePaymentStore = create((set) => ({
  payments: [],
  pagination: {},
  isLoading: false,
  error: null,

  fetchPayments: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/payments', { params });
      set({ payments: response.data.data, pagination: response.data.pagination, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to load payments.', isLoading: false });
    }
  },

  createPayment: async (data) => {
    try {
      const response = await api.post('/payments', data);
      const newPayment = response.data.data;
      set((state) => ({ payments: [newPayment, ...state.payments] }));
      return { success: true, data: newPayment, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to record payment.' };
    }
  }
}));

export default usePaymentStore;
