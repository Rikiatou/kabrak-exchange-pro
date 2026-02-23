import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../src/store/authStore';
import useLicenseStore from '../src/store/licenseStore';
import useLanguageStore from '../src/store/languageStore';
import { COLORS } from '../src/constants/colors';

export default function Index() {
  const { isAuthenticated, loadUser } = useAuthStore();
  const { loadStoredLicense, checkOnline, isValid } = useLicenseStore();
  const { init: loadLanguage } = useLanguageStore();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      await loadLanguage();
      await loadStoredLicense();
      const licenseState = useLicenseStore.getState();
      if (!licenseState.isValid) {
        router.replace('/(auth)/welcome');
        return;
      }
      await checkOnline();
      const licenseStateAfter = useLicenseStore.getState();
      if (!licenseStateAfter.isValid) {
        router.replace('/(auth)/welcome');
        return;
      }
      await loadUser();
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
        router.replace('/tabs)/dashboard');
      } else {
        router.replace('/auth)/welcome');
      }
    };
    init();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
      <ActivityIndicator size="large" color={COLORS.white} />
    </View>
  );
}
