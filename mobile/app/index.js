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

      // Try to load user first (if token exists)
      await loadUser();
      const authState = useAuthStore.getState();

      // Team members (cashier/manager) don't have their own license
      // They share the owner's license — bypass license check
      const isTeamMember = authState.isAuthenticated && authState.user?.teamOwnerId;
      if (isTeamMember) {
        router.replace('/(tabs)/dashboard');
        return;
      }

      // For owners/standalone users: check license
      if (authState.isAuthenticated) {
        // Try fetching license from backend first
        const { fetchMyLicense } = useLicenseStore.getState();
        await fetchMyLicense();
        const licState = useLicenseStore.getState();
        if (licState.isValid) {
          router.replace('/(tabs)/dashboard');
        } else {
          // Fallback: check local storage
          await loadStoredLicense();
          const fallback = useLicenseStore.getState();
          if (fallback.isValid) {
            checkOnline().catch(() => {});
            router.replace('/(tabs)/dashboard');
          } else {
            router.replace('/(auth)/license');
          }
        }
      } else {
        // Not authenticated: check stored license for display purposes
        await loadStoredLicense();
        router.replace('/(auth)/welcome');
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
