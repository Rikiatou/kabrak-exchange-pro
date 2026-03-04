import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  StatusBar, FlatList, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useOnboardingStore from '../../src/store/onboardingStore';
import useLanguageStore from '../../src/store/languageStore';

const { width, height } = Dimensions.get('window');
const GREEN_DARK = '#071a12';
const GREEN_MID = '#0a3d22';
const GREEN = '#0B6E4F';
const GOLD = '#e8a020';
const WHITE = '#ffffff';

const SLIDES_FR = [
  {
    icon: 'swap-horizontal',
    iconBg: GOLD,
    title: 'Bienvenue !',
    desc: 'KABRAK Exchange Pro gère votre bureau de change de A à Z : clients, transactions, dépôts, reçus et rapports.',
    tip: 'Suivez ce guide rapide pour démarrer',
  },
  {
    icon: 'list',
    iconBg: '#10b981',
    title: 'Démarrage rapide',
    desc: '1. Ajoutez vos devises\n2. Créez un client\n3. Faites votre 1ère transaction\n4. Partagez le reçu par WhatsApp',
    tip: '4 étapes pour être opérationnel',
  },
  {
    icon: 'people',
    iconBg: '#3b82f6',
    title: 'Clients',
    desc: 'Ajoutez un client avec nom et téléphone. Retrouvez tout son historique : transactions, dettes, versements et reçus.',
    tip: 'Onglet Clients en bas',
  },
  {
    icon: 'trending-up',
    iconBg: GREEN,
    title: 'Transactions',
    desc: 'Achetez ou vendez des devises. Saisissez le montant, le taux s\'applique automatiquement. Un reçu PDF est généré instantanément.',
    tip: 'Bouton + sur le dashboard',
  },
  {
    icon: 'wallet',
    iconBg: '#8b5cf6',
    title: 'Dépôts',
    desc: 'Créez une commande de dépôt → envoyez le code au client par WhatsApp → il upload son reçu → vous vérifiez et confirmez.',
    tip: 'Menu Dépôts dans les raccourcis',
  },
  {
    icon: 'bar-chart',
    iconBg: '#f59e0b',
    title: 'Rapports & Profit',
    desc: 'Suivez votre profit réel (aujourd\'hui, semaine, mois). Exportez vos données en Excel ou PDF pour votre comptabilité.',
    tip: 'Onglet Rapports dans le menu',
  },
  {
    icon: 'settings',
    iconBg: '#6366f1',
    title: 'Paramètres',
    desc: 'Personnalisez : nom du business, logo, devises actives, équipe (employés/managers), et notifications push.',
    tip: 'Onglet Plus → Paramètres',
  },
];

const SLIDES_EN = [
  {
    icon: 'swap-horizontal',
    iconBg: GOLD,
    title: 'Welcome!',
    desc: 'KABRAK Exchange Pro manages your exchange office end-to-end: clients, transactions, deposits, receipts and reports.',
    tip: 'Follow this quick guide to get started',
  },
  {
    icon: 'list',
    iconBg: '#10b981',
    title: 'Quick Start',
    desc: '1. Add your currencies\n2. Create a client\n3. Make your 1st transaction\n4. Share the receipt via WhatsApp',
    tip: '4 steps to be operational',
  },
  {
    icon: 'people',
    iconBg: '#3b82f6',
    title: 'Clients',
    desc: 'Add a client with name and phone. Access their full history: transactions, debts, deposits and receipts.',
    tip: 'Clients tab at the bottom',
  },
  {
    icon: 'trending-up',
    iconBg: GREEN,
    title: 'Transactions',
    desc: 'Buy or sell currencies. Enter the amount, the rate applies automatically. A PDF receipt is generated instantly.',
    tip: '+ button on the dashboard',
  },
  {
    icon: 'wallet',
    iconBg: '#8b5cf6',
    title: 'Deposits',
    desc: 'Create a deposit order → send the code to client via WhatsApp → they upload receipt → you verify and confirm.',
    tip: 'Deposits menu in shortcuts',
  },
  {
    icon: 'bar-chart',
    iconBg: '#f59e0b',
    title: 'Reports & Profit',
    desc: 'Track your real profit (today, week, month). Export your data to Excel or PDF for your accounting.',
    tip: 'Reports tab in the menu',
  },
  {
    icon: 'settings',
    iconBg: '#6366f1',
    title: 'Settings',
    desc: 'Customize: business name, logo, active currencies, team (employees/managers), and push notifications.',
    tip: 'More tab → Settings',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboardingStore();
  const { language } = useLanguageStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const slides = language === 'en' ? SLIDES_EN : SLIDES_FR;
  const isLast = currentIndex === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleDone();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const handleDone = async () => {
    await completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item, index }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = scrollX.interpolate({ inputRange, outputRange: [0.8, 1, 0.8], extrapolate: 'clamp' });
    const opacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale }], opacity }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${item.iconBg}20` }]}>
            <View style={[styles.iconInner, { backgroundColor: `${item.iconBg}30` }]}>
              <Ionicons name={item.icon} size={48} color={item.iconBg} />
            </View>
          </View>
        </Animated.View>
        <Animated.View style={{ opacity }}>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideDesc}>{item.desc}</Text>
          {item.tip ? (
            <View style={styles.tipBadge}>
              <Ionicons name="bulb-outline" size={14} color={GOLD} />
              <Text style={styles.tipText}>{item.tip}</Text>
            </View>
          ) : null}
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN_DARK} />
      <View style={styles.bgTop} />
      <View style={styles.bgMid} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      {/* Skip button */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>{language === 'fr' ? 'Passer' : 'Skip'}</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(_, i) => `slide-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        style={styles.flatList}
        contentContainerStyle={{ alignItems: 'center' }}
      />

      {/* Bottom section */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={`dot-${i}`}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity, backgroundColor: i === currentIndex ? GOLD : 'rgba(255,255,255,0.4)' }]}
              />
            );
          })}
        </View>

        {/* Next / Start button */}
        <TouchableOpacity style={[styles.nextBtn, isLast && styles.startBtn]} onPress={handleNext} activeOpacity={0.8}>
          {isLast ? (
            <>
              <Text style={styles.startBtnText}>{language === 'fr' ? 'Commencer' : 'Get Started'}</Text>
              <Ionicons name="arrow-forward" size={20} color={GREEN_DARK} style={{ marginLeft: 8 }} />
            </>
          ) : (
            <Ionicons name="arrow-forward" size={24} color={WHITE} />
          )}
        </TouchableOpacity>

        {/* Page indicator */}
        <Text style={styles.pageText}>{currentIndex + 1} / {slides.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_DARK },
  bgTop: { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.5, backgroundColor: GREEN_MID },
  bgMid: { position: 'absolute', top: height * 0.3, left: 0, right: 0, height: height * 0.4, backgroundColor: GREEN_DARK },
  blob1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(11,110,79,0.15)', top: -70, right: -90 },
  blob2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(11,110,79,0.10)', bottom: 80, left: -80 },

  skipBtn: { position: 'absolute', top: 56, right: 24, zIndex: 10, padding: 8 },
  skipText: { color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: '600' },

  flatList: { flex: 1 },
  slide: { width, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center', paddingTop: height * 0.12 },

  iconContainer: { marginBottom: 40 },
  iconCircle: {
    width: 140, height: 140, borderRadius: 70,
    justifyContent: 'center', alignItems: 'center',
  },
  iconInner: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
  },

  slideTitle: {
    fontSize: 28, fontWeight: '900', color: WHITE,
    textAlign: 'center', letterSpacing: -0.3, lineHeight: 36,
    marginBottom: 16,
  },
  slideDesc: {
    fontSize: 15, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 22, paddingHorizontal: 8,
  },
  tipBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 6,
    backgroundColor: 'rgba(232,160,32,0.12)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8, marginTop: 16,
  },
  tipText: { color: GOLD, fontSize: 12, fontWeight: '700' },

  bottom: { paddingBottom: 50, paddingHorizontal: 32, alignItems: 'center' },

  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 28 },
  dot: { height: 8, borderRadius: 4 },

  nextBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center',
    shadowColor: GREEN, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
    marginBottom: 16,
  },
  startBtn: {
    width: '100%', height: 56, borderRadius: 16,
    backgroundColor: GOLD, flexDirection: 'row',
  },
  startBtnText: { fontSize: 17, fontWeight: '800', color: GREEN_DARK },

  pageText: { color: 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: '600' },
});
