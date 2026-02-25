import { create } from 'zustand';
import api from '../services/api';

const useDepositOrderStore = create((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const query = new URLSearchParams(params).toString();
      const res = await api.get(`/deposit-orders${query ? `?${query}` : ''}`);
      set({ orders: res.data.data, loading: false });
    } catch (e) {
      set({ loading: false, error: e.response?.data?.message || 'Error' });
    }
  },

  createOrder: async (data) => {
    try {
      const res = await api.post('/deposit-orders', data);
      await get().fetchOrders({}); // fetch all, no filter
      return { success: true, data: res.data.data };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Error' };
    }
  },

  getOrder: async (id) => {
    try {
      const res = await api.get(`/deposit-orders/${id}`);
      return { success: true, data: res.data.data };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Error' };
    }
  },

  addPayment: async (orderId, data) => {
    try {
      const res = await api.post(`/deposit-orders/${orderId}/payments`, data);
      await get().fetchOrders();
      return { success: true, data: res.data.data };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Error' };
    }
  },

  cancelOrder: async (id) => {
    try {
      await api.put(`/deposit-orders/${id}/cancel`);
      await get().fetchOrders();
      return { success: true };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Error' };
    }
  },

  getClientOrders: async (clientName, clientId) => {
    try {
      const param = clientId
        ? `clientId=${encodeURIComponent(clientId)}`
        : `search=${encodeURIComponent(clientName)}`;
      const res = await api.get(`/deposit-orders?${param}`);
      return { success: true, data: res.data.data };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Error' };
    }
  },
}));

export default useDepositOrderStore;
