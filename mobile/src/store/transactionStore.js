import { create } from 'zustand';
import api from '../services/api';

const useTransactionStore = create((set, get) => ({
  transactions: [],
  currentTransaction: null,
  pagination: {},
  isLoading: false,
  error: null,

  fetchTransactions: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/transactions', { params });
      set({ transactions: response.data.data, pagination: response.data.pagination, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to load transactions.', isLoading: false });
    }
  },

  fetchTransactionById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/transactions/${id}`);
      set({ currentTransaction: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to load transaction.', isLoading: false });
    }
  },

  createTransaction: async (data) => {
    try {
      const response = await api.post('/transactions', data);
      const newTx = response.data.data;
      set((state) => ({ transactions: [newTx, ...state.transactions] }));
      return { success: true, data: newTx };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to create transaction.' };
    }
  },

  updateTransaction: async (id, data) => {
    try {
      const response = await api.put(`/transactions/${id}`, data);
      const updated = response.data.data;
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
        currentTransaction: state.currentTransaction?.id === id ? updated : state.currentTransaction
      }));
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update transaction.' };
    }
  },

  getByReference: async (reference) => {
    try {
      const response = await api.get(`/transactions/ref/${reference}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Transaction not found.' };
    }
  }
}));

export default useTransactionStore;
