import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_PREFIX = 'offline_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const cacheData = async (key, data) => {
  try {
    const payload = JSON.stringify({ data, timestamp: Date.now() });
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, payload);
  } catch (e) {
    console.warn('Cache write error:', e.message);
  }
};

export const getCachedData = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return data;
  } catch (e) {
    console.warn('Cache read error:', e.message);
    return null;
  }
};

export const isOnline = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable !== false;
  } catch {
    return true;
  }
};

/**
 * Wrapper: try API call, cache result on success, return cached data on failure.
 * @param {string} cacheKey - unique cache key
 * @param {Function} apiFn - async function that returns data
 * @returns {Promise<{data: any, fromCache: boolean}>}
 */
export const fetchWithCache = async (cacheKey, apiFn) => {
  const online = await isOnline();
  if (online) {
    try {
      const data = await apiFn();
      await cacheData(cacheKey, data);
      return { data, fromCache: false };
    } catch (e) {
      const cached = await getCachedData(cacheKey);
      if (cached) return { data: cached, fromCache: true };
      throw e;
    }
  } else {
    const cached = await getCachedData(cacheKey);
    if (cached) return { data: cached, fromCache: true };
    throw new Error('Pas de connexion internet et aucune donnée en cache.');
  }
};

/**
 * Queue an action for later sync when back online.
 */
const PENDING_QUEUE_KEY = 'offline_pending_actions';

export const queueOfflineAction = async (action) => {
  try {
    const raw = await AsyncStorage.getItem(PENDING_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({ ...action, queuedAt: Date.now() });
    await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Queue write error:', e.message);
  }
};

export const getPendingActions = async () => {
  try {
    const raw = await AsyncStorage.getItem(PENDING_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearPendingActions = async () => {
  await AsyncStorage.removeItem(PENDING_QUEUE_KEY);
};

export const syncPendingActions = async (apiInstance) => {
  const actions = await getPendingActions();
  if (actions.length === 0) return { synced: 0, failed: 0 };
  let synced = 0;
  let failed = 0;
  const remaining = [];
  for (const action of actions) {
    try {
      if (action.method === 'POST') {
        await apiInstance.post(action.url, action.data);
      } else if (action.method === 'PUT') {
        await apiInstance.put(action.url, action.data);
      }
      synced++;
    } catch {
      failed++;
      remaining.push(action);
    }
  }
  await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(remaining));
  return { synced, failed };
};
