import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import useAuthStore from '../src/store/authStore';
import useLanguageStore from '../src/store/languageStore';
import { syncPendingActions, getPendingActions } from '../src/services/offlineCache';
import api from '../src/services/api';

export default function RootLayout() {
  const { loadUser } = useAuthStore();
  const { init } = useLanguageStore();
  const wasOffline = useRef(false);

  useEffect(() => {
    loadUser();
    init();

    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      if (online && wasOffline.current) {
        wasOffline.current = false;
        const pending = await getPendingActions();
        if (pending.length > 0) {
          const result = await syncPendingActions(api);
          if (result.synced > 0) {
            Alert.alert('✅ Sync terminée', `${result.synced} action(s) synchronisée(s) avec le serveur.`);
          }
        }
      }
      if (!online) {
        wasOffline.current = true;
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
