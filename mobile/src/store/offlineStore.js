import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const useOfflineStore = create((set, get) => ({
  // Offline data cache
  transactions: [],
  clients: [],
  currencies: [],
  dashboard: null,
  lastSyncTime: null,
  
  // Actions queue for sync when online
  actionQueue: [],
  
  // Network status
  isOnline: true,
  
  // Set network status
  setOnlineStatus: (isOnline) => set({ isOnline }),
  
  // Save data to cache
  saveToCache: async (key, data) => {
    try {
      await AsyncStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      set({ [key]: data });
    } catch (error) {
      console.log('Cache save error:', error);
    }
  },
  
  // Load data from cache
  loadFromCache: async (key) => {
    try {
      const cached = await AsyncStorage.getItem(`offline_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          set({ [key]: data });
          return data;
        }
      }
    } catch (error) {
      console.log('Cache load error:', error);
    }
    return null;
  },
  
  // Add action to queue (for sync when online)
  addToQueue: async (action) => {
    const { actionQueue } = get();
    const newAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now(),
      retries: 0
    };
    
    const updatedQueue = [...actionQueue, newAction];
    set({ actionQueue: updatedQueue });
    
    try {
      await AsyncStorage.setItem('offline_actionQueue', JSON.stringify(updatedQueue));
    } catch (error) {
      console.log('Queue save error:', error);
    }
  },
  
  // Load action queue
  loadActionQueue: async () => {
    try {
      const queue = await AsyncStorage.getItem('offline_actionQueue');
      if (queue) {
        const parsedQueue = JSON.parse(queue);
        set({ actionQueue: parsedQueue });
      }
    } catch (error) {
      console.log('Queue load error:', error);
    }
  },
  
  // Process action queue when online
  processActionQueue: async (api) => {
    const { actionQueue } = get();
    if (actionQueue.length === 0) return;
    
    const processedActions = [];
    const failedActions = [];
    
    for (const action of actionQueue) {
      try {
        await api[action.method](action.endpoint, action.data);
        processedActions.push(action);
      } catch (error) {
        console.log('Action failed:', action.type, error);
        if (action.retries < 3) {
          failedActions.push({ ...action, retries: action.retries + 1 });
        }
      }
    }
    
    // Update queue
    const remainingActions = actionQueue.filter(a => !processedActions.includes(a));
    set({ actionQueue: [...failedActions, ...remainingActions] });
    
    try {
      await AsyncStorage.setItem('offline_actionQueue', JSON.stringify([...failedActions, ...remainingActions]));
    } catch (error) {
      console.log('Queue update error:', error);
    }
    
    return { processed: processedActions.length, failed: failedActions.length };
  },
  
  // Clear old cache
  clearCache: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('offline_'));
      await AsyncStorage.multiRemove(offlineKeys);
      set({ 
        transactions: [], 
        clients: [], 
        currencies: [], 
        dashboard: null,
        lastSyncTime: null 
      });
    } catch (error) {
      console.log('Cache clear error:', error);
    }
  },
  
  // Update last sync time
  updateLastSync: () => {
    const now = Date.now();
    set({ lastSyncTime: now });
    AsyncStorage.setItem('offline_lastSync', now.toString());
  },
  
  // Load last sync time
  loadLastSync: async () => {
    try {
      const syncTime = await AsyncStorage.getItem('offline_lastSync');
      if (syncTime) {
        set({ lastSyncTime: parseInt(syncTime) });
      }
    } catch (error) {
      console.log('Sync time load error:', error);
    }
  }
}));

export default useOfflineStore;
