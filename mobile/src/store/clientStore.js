import { create } from 'zustand';
import api from '../services/api';

const useClientStore = create((set, get) => ({
  clients: [],
  currentClient: null,
  pagination: {},
  isLoading: false,
  error: null,

  fetchClients: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/clients', { params });
      set({ clients: response.data.data, pagination: response.data.pagination, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to load clients.', isLoading: false });
    }
  },

  fetchClientById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/clients/${id}`);
      set({ currentClient: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to load client.', isLoading: false });
    }
  },

  createClient: async (data) => {
    try {
      const response = await api.post('/clients', data);
      const newClient = response.data.data;
      set((state) => ({ clients: [newClient, ...state.clients] }));
      return { success: true, data: newClient };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to create client.' };
    }
  },

  updateClient: async (id, data) => {
    try {
      const response = await api.put(`/clients/${id}`, data);
      const updated = response.data.data;
      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? updated : c)),
        currentClient: state.currentClient?.id === id ? updated : state.currentClient
      }));
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update client.' };
    }
  },

  deleteClient: async (id) => {
    try {
      await api.delete(`/clients/${id}`);
      set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete client.' };
    }
  },

  getClientTransactions: async (id, params = {}) => {
    try {
      const response = await api.get(`/clients/${id}/transactions`, { params });
      return { success: true, data: response.data.data, pagination: response.data.pagination };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to load transactions.' };
    }
  }
}));

export default useClientStore;
