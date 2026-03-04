import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'kabrak_onboarding_done';
const TOOLTIPS_KEY = 'kabrak_tooltips_seen';

const useOnboardingStore = create((set, get) => ({
  onboardingDone: false,
  tooltipsSeen: {},
  isLoading: true,

  load: async () => {
    try {
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      const seen = await AsyncStorage.getItem(TOOLTIPS_KEY);
      set({
        onboardingDone: done === 'true',
        tooltipsSeen: seen ? JSON.parse(seen) : {},
        isLoading: false,
      });
    } catch (_) {
      set({ isLoading: false });
    }
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ onboardingDone: true });
  },

  resetOnboarding: async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    await AsyncStorage.removeItem(TOOLTIPS_KEY);
    set({ onboardingDone: false, tooltipsSeen: {} });
  },

  markTooltipSeen: async (screenKey) => {
    const { tooltipsSeen } = get();
    const updated = { ...tooltipsSeen, [screenKey]: true };
    await AsyncStorage.setItem(TOOLTIPS_KEY, JSON.stringify(updated));
    set({ tooltipsSeen: updated });
  },

  isTooltipSeen: (screenKey) => {
    return get().tooltipsSeen[screenKey] === true;
  },
}));

export default useOnboardingStore;
