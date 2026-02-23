import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../src/store/authStore';
import useLicenseStore from '../src/store/licenseStore';
import useLanguageStore from '../src/store/languageStore';
import { COLORS } from '../src/constants/colors';

const { width, height } = require('react-native').Dimensions;

export default function WelcomeScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, loadUser } = useAuthStore();
  const { loadStoredLicense, checkOnline, isValid } = useLicenseStore();
  const { init: loadLanguage } = useLanguageStore();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      await loadLanguage();
      await loadStoredLicense();
      
      const licenseState = useLicenseStore.getState();
      if (licenseState.isValid) {
        // Si licence valide, charger l'utilisateur
        await checkOnline();
        const licenseStateAfter = useLicenseStore.getState();
        if (licenseStateAfter.isValid) {
          await loadUser();
          const { isAuthenticated } = useAuthStore.getState();
          if (isAuthenticated) {
            router.replace('/(tabs)/dashboard');
          } else {
            router.replace('/(auth)/login');
          }
          return;
        }
      }
      
      // Si pas de licence valide, rester sur welcome
      setIsLoading(false);
    };
    init();
  }, []);

  const handleTrial = async () => {
    setIsLoading(true);
    
    try {
      // Rediriger vers la page de paiement pour le trial
      router.push('/(auth)/payment');
    } catch (error) {
      console.error('Error navigating to trial:', error);
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const handleLicenseKey = () => {
    router.push('/(auth)/license');
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      style={styles.container}
    >
      {/* Background Elements */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Ionicons name="swap-horizontal" size={32} color={COLORS.gold} />
          </View>
          <Text style={styles.logoText}>
            KABRAK <Text style={{ color: COLORS.gold }}>Exchange Pro</Text>
          </Text>
        </View>

        {/* Shield Icon */}
        <View style={styles.shieldContainer}>
          <Ionicons name="shield-checkmark" size={80} color={COLORS.gold} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Bienvenue</Text>
        <Text style={styles.subtitle}>
          La solution professionnelle pour bureaux de change
        </Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="trending-up" size={24} color={COLORS.white} />
            <Text style={styles.featureText}>Taux de change en temps réel</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.white} />
            <Text style={styles.featureText}>Sécurité maximale</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="phone-portrait" size={24} color={COLORS.white} />
            <Text style={styles.featureText}>Application mobile</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity 
            style={[styles.ctaButton, styles.trialButton]} 
            onPress={handleTrial}
          >
            <Ionicons name="gift" size={20} color={COLORS.white} style={styles.buttonIcon} />
            <Text style={styles.ctaButtonText}>ESSAI GRATUIT 14 JOURS</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.ctaButton, styles.loginButton]} 
            onPress={handleLogin}
          >
            <Ionicons name="log-in" size={20} color={COLORS.white} style={styles.buttonIcon} />
            <Text style={styles.ctaButtonText}>SE CONNECTER</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.ctaButton, styles.licenseButton]} 
            onPress={handleLicenseKey}
          >
            <Ionicons name="key" size={20} color={COLORS.white} style={styles.buttonIcon} />
            <Text style={styles.ctaButtonText}>ACTIVER UNE LICENCE</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="call" size={16} color={COLORS.white} />
            <Text style={styles.contactText}>Contactez-nous</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  blob1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    left: -50,
  },
  blob2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    bottom: 100,
    right: -30,
  },
  blob3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: 200,
    right: 50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  shieldContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 40,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.white,
    marginLeft: 10,
  },
  ctaContainer: {
    width: '100%',
    gap: 15,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    minWidth: width * 0.8,
  },
  trialButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  loginButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    borderWidth: 2,
    borderColor: COLORS.info,
  },
  licenseButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderWidth: 2,
    borderColor: COLORS.danger,
  },
  buttonIcon: {
    marginRight: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  contactText: {
    color: COLORS.white,
    fontSize: 14,
    marginLeft: 8,
  },
});
