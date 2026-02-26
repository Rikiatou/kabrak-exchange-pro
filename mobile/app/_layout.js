import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NetInfo from '@react-native-community/netinfo';
import { Alert, View, Text, StyleSheet, Animated } from 'react-native';
import Constants from 'expo-constants';
import useAuthStore from '../src/store/authStore';
import useLanguageStore from '../src/store/languageStore';
import { syncPendingActions, getPendingActions } from '../src/services/offlineCache';
import api from '../src/services/api';

let Notifications = null;
const isExpoGo = Constants.executionEnvironment === 'storeClient';
if (!isExpoGo) {
  try { Notifications = require('expo-notifications'); } catch (_) {}
}

export default function RootLayout() {
  const { loadUser } = useAuthStore();
  const { init } = useLanguageStore();
  const router = useRouter();
  const wasOffline = useRef(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const bannerAnim = useRef(new Animated.Value(0)).current;

  const showBanner = (show) => {
    Animated.timing(bannerAnim, {
      toValue: show ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    loadUser();
    init();

    // NetInfo: offline banner + auto sync
    const unsubscribeNet = NetInfo.addEventListener(async (state) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      if (online && wasOffline.current) {
        wasOffline.current = false;
        setIsOffline(false);
        showBanner(false);
        const pending = await getPendingActions();
        if (pending.length > 0) {
          const result = await syncPendingActions(api);
          setPendingCount(0);
          if (result.synced > 0) {
            Alert.alert('✅ Sync terminée', `${result.synced} action(s) synchronisée(s) avec le serveur.`);
          }
        }
      }
      if (!online) {
        wasOffline.current = true;
        setIsOffline(true);
        showBanner(true);
        const pending = await getPendingActions();
        setPendingCount(pending.length);
      }
    });

    // Push notifications listener
    let unsubscribeNotif = () => {};
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      const sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data || {};
        if (data.type === 'transaction' && data.id) {
          router.push(`/transactions/${data.id}`);
        } else if (data.type === 'deposit' && data.id) {
          router.push('/deposits');
        } else if (data.type === 'alert') {
          router.push('/alerts');
        }
      });
      unsubscribeNotif = () => sub.remove();
    }

    return () => {
      unsubscribeNet();
      unsubscribeNotif();
    };
  }, []);

  const bannerTranslate = bannerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-48, 0],
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Animated.View style={[s.offlineBanner, { transform: [{ translateY: bannerTranslate }] }]}>
        <Text style={s.offlineText}>
          📡 Hors-ligne{pendingCount > 0 ? ` · ${pendingCount} action(s) en attente` : ''}
        </Text>
      </Animated.View>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  offlineBanner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999,
    backgroundColor: '#dc2626', paddingTop: 44, paddingBottom: 8,
    alignItems: 'center',
  },
  offlineText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
