import { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  Animated, Dimensions, StatusBar, Modal, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useLanguageStore from '../../src/store/languageStore';
import { IS_BOGO, APP_NAME_SHORT, APP_NAME_SUB, BRAND_DARK, BRAND_MID, BRAND_MAIN, BRAND_GOLD, LOGO_IMAGE } from '../../src/constants/whitelabel';

const { width, height } = Dimensions.get('window');
const GREEN_DARK  = BRAND_DARK;
const GREEN_MID   = BRAND_MID;
const GREEN_MAIN  = BRAND_MAIN;
const GOLD        = BRAND_GOLD;
const WHITE       = '#ffffff';

export default function WelcomeScreen() {
  const router = useRouter();
  const [aboutVisible, setAboutVisible] = useState(false);
  const { t, language, toggleLanguage } = useLanguageStore();

  const fade1  = useRef(new Animated.Value(0)).current;
  const slide1 = useRef(new Animated.Value(28)).current;
  const fade2  = useRef(new Animated.Value(0)).current;
  const slide2 = useRef(new Animated.Value(20)).current;
  const fade3  = useRef(new Animated.Value(0)).current;
  const slide3 = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade1,  { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(slide1, { toValue: 0, duration: 550, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fade2,  { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(slide2, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fade3,  { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(slide3, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN_DARK} />

      {/* Background gradient layers */}
      <View style={styles.bgTop} />
      <View style={styles.bgMid} />

      {/* Wave shape at bottom */}
      <View style={styles.waveWrap}>
        <View style={styles.waveEllipse} />
      </View>

      {/* Glow blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Logo row */}
        <Animated.View style={[styles.logoRow, { opacity: fade1, transform: [{ translateY: slide1 }] }]}>
          {IS_BOGO ? (
            <Image source={LOGO_IMAGE} style={styles.bogoLogo} resizeMode="contain" />
          ) : (
            <View style={styles.logoIconWrap}>
              <Ionicons name="swap-horizontal" size={20} color={GOLD} />
            </View>
          )}
          {!IS_BOGO && (
            <Text style={styles.logoText}>
              {APP_NAME_SHORT} <Text style={styles.logoTextGold}>{APP_NAME_SUB}</Text>
            </Text>
          )}
          <TouchableOpacity style={[styles.langBtn, IS_BOGO && { marginLeft: 'auto' }]} onPress={toggleLanguage}>
            <Text style={styles.langBtnText}>{language === 'fr' ? 'EN' : 'FR'}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Hero text */}
        <Animated.View style={[styles.heroBlock, { opacity: fade1, transform: [{ translateY: slide1 }] }]}>
          <Text style={styles.heroTitle}>{t.welcome.heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{t.welcome.heroSubtitle}</Text>
        </Animated.View>

        {/* Feature pills row */}
        <Animated.View style={[styles.featRow, { opacity: fade2, transform: [{ translateY: slide2 }] }]}>
          {[
            { icon: 'people-outline',       label: t.welcome.features.clients },
            { icon: 'checkmark-circle-outline', label: t.welcome.features.payments },
            { icon: 'bar-chart-outline',    label: t.welcome.features.profit },
          ].map((f, i) => (
            <View key={f.label} style={styles.featPill}>
              <Ionicons name={f.icon} size={15} color={WHITE} />
              <Text style={styles.featPillText}>{f.label}</Text>
              {i < 2 && <Text style={styles.featDot}>·</Text>}
            </View>
          ))}
        </Animated.View>

        {/* CTA buttons */}
        <Animated.View style={[styles.ctaBlock, { opacity: fade3, transform: [{ translateY: slide3 }] }]}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>{t.welcome.getStarted}</Text>
          </TouchableOpacity>

          {!IS_BOGO && (
            <TouchableOpacity
              style={styles.btnTrial}
              onPress={() => router.push('/(auth)/register-trial')}
              activeOpacity={0.85}
            >
              <Ionicons name="gift-outline" size={18} color={GOLD} style={{ marginRight: 8 }} />
              <Text style={styles.btnTrialText}>{language === 'fr' ? 'Essai gratuit — 14 jours' : 'Free trial — 14 days'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => setAboutVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSecondaryText}>{t.welcome.aboutBtn}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer trust row */}
        <Animated.View style={[styles.trustRow, { opacity: fade3 }]}>
          <View style={styles.trustLine} />
          <Text style={styles.trustText}>{t.welcome.trust}</Text>
          <View style={styles.trustLine} />
        </Animated.View>
      </ScrollView>

      {/* About modal */}
      <Modal visible={aboutVisible} transparent animationType="slide" onRequestClose={() => setAboutVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalLogoRow}>
              <View style={styles.logoIconWrap}>
                <Ionicons name="swap-horizontal" size={20} color={GOLD} />
              </View>
              <Text style={styles.modalTitle}>{t.welcome.aboutTitle}</Text>
            </View>
            <Text style={styles.modalVersion}>{t.welcome.aboutVersion}</Text>
            <Text style={styles.modalDesc}>{t.welcome.aboutDesc}</Text>
            <View style={styles.modalFeatures}>
              {[
                { icon: 'people',          text: t.welcome.aboutFeatures.clients },
                { icon: 'swap-horizontal', text: t.welcome.aboutFeatures.currencies },
                { icon: 'document-text',   text: t.welcome.aboutFeatures.pdf },
                { icon: 'bar-chart',       text: t.welcome.aboutFeatures.reports },
                { icon: 'shield-checkmark',text: t.welcome.aboutFeatures.security },
              ].map((f) => (
                <View key={f.text} style={styles.modalFeatRow}>
                  <Ionicons name={f.icon} size={16} color={GREEN_MAIN} />
                  <Text style={styles.modalFeatText}>{f.text}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.modalClose} onPress={() => setAboutVisible(false)}>
              <Text style={styles.modalCloseText}>{t.welcome.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_DARK },
  langBtn: {
    marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1.5, borderColor: GOLD,
    backgroundColor: 'rgba(232,160,32,0.12)',
  },
  langBtnText: { color: GOLD, fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  bgTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: height * 0.55,
    backgroundColor: GREEN_MID,
  },
  bgMid: {
    position: 'absolute', top: height * 0.3, left: 0, right: 0,
    height: height * 0.4,
    backgroundColor: GREEN_DARK,
  },

  waveWrap: {
    position: 'absolute', bottom: 0, left: -width * 0.3, right: -width * 0.3,
    height: height * 0.35, overflow: 'hidden',
  },
  waveEllipse: {
    position: 'absolute', bottom: -height * 0.12,
    left: 0, right: 0,
    height: height * 0.45,
    borderRadius: width * 0.8,
    backgroundColor: 'rgba(11,110,79,0.22)',
  },

  blob1: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(11,110,79,0.15)', top: -80, right: -100,
  },
  blob2: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(11,110,79,0.12)', top: height * 0.25, left: -100,
  },
  blob3: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(11,110,79,0.10)', bottom: 60, right: -60,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 48,
    alignItems: 'center',
  },

  logoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 52,
    alignSelf: 'center',
    width: '100%',
  },
  bogoLogo: {
    width: 120, height: 120, borderRadius: 16,
  },
  logoIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(232,160,32,0.15)',
    borderWidth: 1, borderColor: 'rgba(232,160,32,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: {
    fontSize: 20, fontWeight: '800', color: WHITE, letterSpacing: -0.3,
  },
  logoTextGold: { color: GOLD },

  heroBlock: { alignItems: 'center', marginBottom: 40 },
  heroTitle: {
    fontSize: 32, fontWeight: '800', color: WHITE,
    textAlign: 'center', letterSpacing: -0.5, marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15, fontWeight: '600', color: GOLD,
    textAlign: 'center', letterSpacing: 0.2,
  },

  featRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', flexWrap: 'wrap',
    gap: 6, marginBottom: 48,
  },
  featPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  featPillText: {
    fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500',
  },
  featDot: {
    fontSize: 16, color: 'rgba(255,255,255,0.3)', marginLeft: 6,
  },

  ctaBlock: { width: '100%', gap: 14, marginBottom: 40 },
  btnPrimary: {
    height: 54, borderRadius: 10,
    backgroundColor: GREEN_MAIN,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: GREEN_MAIN, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  btnPrimaryText: {
    color: WHITE, fontSize: 16, fontWeight: '700', letterSpacing: 0.3,
  },
  btnTrial: {
    height: 54, borderRadius: 10,
    borderWidth: 1.5, borderColor: GOLD,
    backgroundColor: 'rgba(232,160,32,0.12)',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  btnTrialText: {
    color: GOLD, fontSize: 15, fontWeight: '700',
  },
  btnSecondary: {
    height: 54, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  btnSecondaryText: {
    color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600',
  },

  trustRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  trustLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  trustText: {
    fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.3,
  },

  /* About modal */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e2e8f0', alignSelf: 'center', marginBottom: 20,
  },
  modalLogoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  modalVersion: { fontSize: 12, color: '#94a3b8', marginBottom: 14, marginLeft: 48 },
  modalDesc: {
    fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 20,
  },
  modalFeatures: { gap: 12, marginBottom: 28 },
  modalFeatRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalFeatText: { fontSize: 13, color: '#334155', flex: 1 },
  modalClose: {
    height: 50, borderRadius: 10, backgroundColor: GREEN_MAIN,
    justifyContent: 'center', alignItems: 'center',
  },
  modalCloseText: { color: WHITE, fontSize: 15, fontWeight: '700' },
});
