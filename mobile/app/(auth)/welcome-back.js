import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  StatusBar, Dimensions, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useSettingStore from '../../src/store/settingStore';
import useLanguageStore from '../../src/store/languageStore';

const { width, height } = Dimensions.get('window');
const GREEN_DARK = '#071a12';
const GREEN_MID  = '#0a3d22';
const GREEN_MAIN = '#0B6E4F';
const GOLD       = '#e8a020';
const WHITE      = '#ffffff';

export default function WelcomeBackScreen() {
  const router = useRouter();
  const { settings, fetchSettings } = useSettingStore();
  const { language } = useLanguageStore();

  const scaleAnim  = useRef(new Animated.Value(0.7)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const fade2      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchSettings().then(() => {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
          Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(fade2,    { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(slideAnim,{ toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();
    });

    const timer = setTimeout(() => {
      router.replace('/(tabs)/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const { businessName, businessLogo } = settings;
  const name = businessName || 'votre espace';
  const greeting = language === 'fr'
    ? `Bon retour dans\n${name}`
    : `Welcome back to\n${name}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN_DARK} />

      <View style={styles.bgTop} />
      <View style={styles.bgMid} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {businessLogo ? (
            <Image source={{ uri: businessLogo }} style={styles.businessLogo} resizeMode="contain" />
          ) : (
            <View style={styles.defaultLogoWrap}>
              <Ionicons name="swap-horizontal" size={36} color={GOLD} />
            </View>
          )}
        </Animated.View>

        {/* Greeting */}
        <Animated.View style={{ opacity: fade2, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
          <Text style={styles.greeting}>{greeting}</Text>
          <View style={styles.dotRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </Animated.View>

        {/* Powered by */}
        <Animated.View style={[styles.poweredRow, { opacity: fade2 }]}>
          <Text style={styles.poweredText}>Powered by </Text>
          <Text style={styles.poweredBrand}>KABRAK Exchange Pro</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_DARK },

  bgTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: height * 0.6, backgroundColor: GREEN_MID,
  },
  bgMid: {
    position: 'absolute', top: height * 0.35, left: 0, right: 0,
    height: height * 0.4, backgroundColor: GREEN_DARK,
  },
  blob1: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(11,110,79,0.18)', top: -80, right: -100,
  },
  blob2: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(11,110,79,0.12)', bottom: 80, left: -80,
  },

  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, gap: 28,
  },

  logoWrap: { alignItems: 'center', justifyContent: 'center' },
  businessLogo: {
    width: 110, height: 110, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  defaultLogoWrap: {
    width: 100, height: 100, borderRadius: 24,
    backgroundColor: 'rgba(232,160,32,0.15)',
    borderWidth: 2, borderColor: 'rgba(232,160,32,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },

  greeting: {
    fontSize: 28, fontWeight: '800', color: WHITE,
    textAlign: 'center', letterSpacing: -0.3, lineHeight: 36,
    marginBottom: 20,
  },

  dotRow: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
  },
  dot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: GOLD, width: 20,
  },

  poweredRow: {
    position: 'absolute', bottom: 48,
    flexDirection: 'row', alignItems: 'center',
  },
  poweredText: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  poweredBrand: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '700' },
});
