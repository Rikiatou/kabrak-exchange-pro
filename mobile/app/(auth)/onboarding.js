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
    title: 'Bienvenue sur\nKABRAK Exchange Pro',
    desc: 'La solution complète pour gérer votre bureau de change. Simple, rapide et professionnel.',
  },
  {
    icon: 'people',
    iconBg: '#3b82f6',
    title: 'Gérez vos clients',
    desc: 'Ajoutez vos clients, consultez leur historique de transactions et leur solde en un clic.',
  },
  {
    icon: 'trending-up',
    iconBg: GREEN,
    title: 'Transactions & Taux',
    desc: 'Achetez et vendez des devises avec des taux en temps réel. Chaque opération génère un reçu professionnel.',
  },
  {
    icon: 'wallet',
    iconBg: '#8b5cf6',
    title: 'Commandes de dépôt',
    desc: 'Créez une commande, envoyez le code au client par WhatsApp. Il upload son reçu, vous vérifiez et confirmez.',
  },
  {
    icon: 'notifications',
    iconBg: '#ef4444',
    title: 'Notifications en temps réel',
    desc: 'Soyez alerté quand un client fait un versement, quand un taux change ou quand une action est requise.',
  },
  {
    icon: 'settings',
    iconBg: '#6366f1',
    title: 'Personnalisez tout',
    desc: 'Logo, couleurs, devises, employés, reçus — configurez l\'app à votre image dans les Paramètres.',
  },
];

const SLIDES_EN = [
  {
    icon: 'swap-horizontal',
    iconBg: GOLD,
    title: 'Welcome to\nKABRAK Exchange Pro',
    desc: 'The complete solution to manage your exchange office. Simple, fast and professional.',
  },
  {
    icon: 'people',
    iconBg: '#3b82f6',
    title: 'Manage your clients',
    desc: 'Add clients, view their transaction history and balance in one tap.',
  },
  {
    icon: 'trending-up',
    iconBg: GREEN,
    title: 'Transactions & Rates',
    desc: 'Buy and sell currencies with real-time rates. Each operation generates a professional receipt.',
  },
  {
    icon: 'wallet',
    iconBg: '#8b5cf6',
    title: 'Deposit orders',
    desc: 'Create an order, send the code to your client via WhatsApp. They upload the receipt, you verify and confirm.',
  },
  {
    icon: 'notifications',
    iconBg: '#ef4444',
    title: 'Real-time notifications',
    desc: 'Get notified when a client makes a deposit, when a rate changes or when action is needed.',
  },
  {
    icon: 'settings',
    iconBg: '#6366f1',
    title: 'Customize everything',
    desc: 'Logo, colors, currencies, employees, receipts — configure the app to match your brand in Settings.',
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
