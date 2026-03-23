import { useEffect, useState } from 'react';
import useOfflineStore from '../store/offlineStore';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export const useOfflineSync = () => {
  const { 
    isOnline, 
    setOnlineStatus, 
    saveToCache, 
    loadFromCache, 
    addToQueue, 
    processActionQueue,
    loadActionQueue,
    loadLastSync,
    updateLastSync
  } = useOfflineStore();
  
  const { isAuthenticated } = useAuthStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  // Simple network detection - assume online by default
  useEffect(() => {
    setOnlineStatus(true);
    
    // Try to sync when authenticated
    if (isAuthenticated) {
      syncWhenOnline();
    }
  }, [isAuthenticated]);

  // Load cached data on app start
  useEffect(() => {
    if (isAuthenticated) {
      loadOfflineData();
    }
  }, [isAuthenticated]);

  const loadOfflineData = async () => {
    try {
      await Promise.all([
        loadFromCache('transactions'),
        loadFromCache('clients'),
        loadFromCache('currencies'),
        loadFromCache('dashboard'),
        loadActionQueue(),
        loadLastSync()
      ]);
    } catch (error) {
      console.log('Offline data load error:', error);
    }
  };

  const syncWhenOnline = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    setSyncStatus('Synchronisation...');
    
    try {
      // Process action queue first
      const queueResult = await processActionQueue(api);
      
      if (queueResult && queueResult.processed > 0) {
        setSyncStatus(`Synchronisé: ${queueResult.processed} actions`);
      }
      
      // Then refresh data from server
      await refreshDataFromServer();
      
      updateLastSync();
      setSyncStatus('Synchronisé');
      
      // Clear status after 2 seconds
      setTimeout(() => setSyncStatus(null), 2000);
      
    } catch (error) {
      console.log('Sync error:', error);
      setSyncStatus('Erreur de synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshDataFromServer = async () => {
    try {
      const [transactionsRes, clientsRes, currenciesRes, dashboardRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/clients'),
        api.get('/currencies'),
        api.get('/dashboard')
      ]);

      // Save to cache
      await Promise.all([
        saveToCache('transactions', transactionsRes.data.data),
        saveToCache('clients', clientsRes.data.data),
        saveToCache('currencies', currenciesRes.data),
        saveToCache('dashboard', dashboardRes.data.data)
      ]);
      
    } catch (error) {
      console.log('Data refresh error:', error);
      throw error;
    }
  };

  const createOfflineAction = (type, endpoint, method = 'post', data = {}) => {
    return addToQueue({
      type,
      endpoint,
      method,
      data,
      timestamp: Date.now()
    });
  };

  return {
    isOnline,
    isSyncing,
    syncStatus,
    syncWhenOnline,
    createOfflineAction,
    refreshDataFromServer
  };
};
