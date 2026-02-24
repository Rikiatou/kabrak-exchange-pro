import { create } from 'zustand';
import api from '../services/api';
import { fetchWithCache } from '../services/offlineCache';

const useCurrencyStore = create((set) => ({
  currencies: [],
  currentCurrency: null,
  isLoading: false,
  error: null,

  isOffline: false,

  fetchCurrencies: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, fromCache } = await fetchWithCache('currencies', async () => {
        const response = await api.get('/currencies');
        return response.data.data;
      });
      set({ currencies: data, isLoading: false, isOffline: fromCache });
    } catch (error) {
      set({ error: error.message || 'Failed to load currencies.', isLoading: false, isOffline: true });
    }
  },

  fetchCurrencyById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/currencies/${id}`);
      set({ currentCurrency: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({ isLoading: false });
    }
  },

  createCurrency: async (data) => {
    try {
      const response = await api.post('/currencies', data);
      const newCurrency = response.data.data;
      set((state) => ({ currencies: [...state.currencies, newCurrency] }));
      return { success: true, data: newCurrency };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to create currency.' };
    }
  },

  updateCurrency: async (id, data) => {
    try {
      const response = await api.put(`/currencies/${id}`, data);
      const updated = response.data.data;
      set((state) => ({
        currencies: state.currencies.map((c) => (c.id === id ? updated : c)),
        currentCurrency: state.currentCurrency?.id === id ? updated : state.currentCurrency
      }));
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update currency.' };
    }
  },

  getRateHistory: async (code) => {
    try {
      const response = await api.get(`/currencies/history/${code}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to load rate history.' };
    }
  },

  getStockSummary: async () => {
    try {
      const response = await api.get('/currencies/stock');
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Erreur' };
    }
  },

  adjustStock: async (id, adjustment, type) => {
    try {
      const response = await api.put(`/currencies/${id}/stock`, { adjustment, type });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Erreur' };
    }
  },

  getLiveRates: async (base = 'EUR') => {
    try {
      const response = await api.get(`/exchange-rates/live?base=${base}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Impossible de récupérer les taux en direct.' };
    }
  },

  convertLive: async (from, to, amount) => {
    try {
      const response = await api.get(`/exchange-rates/convert?from=${from}&to=${to}&amount=${amount}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Conversion impossible.' };
    }
  },

  getRateForPair: async (from, to, type = 'sell') => {
    try {
      const response = await api.get(`/currencies/rate-for-pair?from=${from}&to=${to}&type=${type}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Impossible de récupérer le taux.' };
    }
  },
}));

export default useCurrencyStore;
