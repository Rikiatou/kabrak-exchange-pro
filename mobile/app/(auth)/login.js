import { useState, useRef } from 'react';
import useLanguageStore from '../../src/store/languageStore';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Alert, Animated, StatusBar, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../src/store/authStore';
import useLicenseStore from '../../src/store/licenseStore';

const { width, height } = Dimensions.get('window');
const GREEN_DARK = '#071a12';
const GREEN_MID  = '#0a3d22';
const GREEN_MAIN = '#0B6E4F';
const GOLD       = '#e8a020';
const WHITE      = '#ffffff';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { t, language } = useLanguageStore();
  const { login, isLoading } = useAuthStore();
  const { isValid: licenseValid } = useLicenseStore();
  const router = useRouter();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      shake();
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    const result = await login(email.trim().toLowerCase(), password);
    if (result.success) {
      const user = useAuthStore.getState().user;
      // Team members share owner's license — go directly to welcome-back
      if (user?.teamOwnerId) {
        router.replace('/(auth)/welcome-back');
        return;
      }
      // Owner: fetch license from backend, then check
      const { fetchMyLicense, loadStoredLicense } = useLicenseStore.getState();
      await fetchMyLicense();
      const { isValid } = useLicenseStore.getState();
      if (!isValid) {
        // Fallback: check local storage
        await loadStoredLicense();
        const fallback = useLicenseStore.getState();
        if (!fallback.isValid) {
          router.replace('/(auth)/license');
        } else {
          router.replace('/(auth)/welcome-back');
        }
      } else {
        router.replace('/(auth)/welcome-back');
      }
    } else {
      shake();
      Alert.alert(t.login.accessDenied, result.message || t.login.incorrectCredentials);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN_DARK} />

      {/* Background layers */}
      <View style={styles.bgTop} />
      <View style={styles.bgMid} />
      <View style={styles.waveWrap}>
        <View style={styles.waveEllipse} />
      </View>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(auth)/welcome')}>
            <Ionicons name="arrow-back" size={22} color={WHITE} />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoIconWrap}>
              <Ionicons name="swap-horizontal" size={20} color={GOLD} />
            </View>
            <Text style={styles.logoText}>
              KABRAK <Text style={styles.logoTextGold}>Exchange Pro</Text>
            </Text>
          </View>

          {/* Heading */}
          <View style={styles.headingBlock}>
            <Text style={styles.heading}>{t.login.welcomeBack}</Text>
            <Text style={styles.headingGold}>{t.login.subtitle}</Text>
          </View>

          {/* White card */}
          <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.login.emailLabel}</Text>
              <View style={[styles.fieldWrapper, emailFocused && styles.fieldFocused]}>
                <Ionicons name="mail-outline" size={17}
                  color={emailFocused ? GREEN_MAIN : '#9ca3af'} style={styles.fieldIcon} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder={t.login.emailPlaceholder}
                  placeholderTextColor="#c4c9d4"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t.login.passwordLabel}</Text>
              <View style={[styles.fieldWrapper, passwordFocused && styles.fieldFocused]}>
                <Ionicons name="lock-closed-outline" size={17}
                  color={passwordFocused ? GREEN_MAIN : '#9ca3af'} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  placeholder={t.login.passwordPlaceholder}
                  placeholderTextColor="#c4c9d4"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  textContentType="password"
                  textAlignVertical="center"
                  importantForAutofill="yes"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotRow} onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotText}>{language === 'fr' ? 'Mot de passe oublié ?' : 'Forgot password?'}</Text>
            </TouchableOpacity>

            {/* Sign In button */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && { opacity: 0.65 }]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color={WHITE} size="small" />
                : <Text style={styles.loginBtnText}>{t.login.signIn}</Text>
              }
            </TouchableOpacity>

            {/* Security hint */}
            <View style={styles.hintRow}>
              <Ionicons name="shield-checkmark-outline" size={12} color="#9ca3af" />
              <Text style={styles.hintText}>{t.login.securityHint}</Text>
            </View>
          </Animated.View>

          {/* Trust row */}
          <View style={styles.trustRow}>
            <View style={styles.trustLine} />
            <Text style={styles.trustText}>{t.login.trust}</Text>
            <View style={styles.trustLine} />
          </View>

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerLabel}>{language === 'fr' ? 'Pas encore de compte ? ' : 'No account yet? '}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register-trial')}>
              <Text style={styles.registerLink}>{language === 'fr' ? 'Essai gratuit' : 'Free trial'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>{t.login.footer}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_DARK },
  kav: { flex: 1 },

  bgTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: height * 0.55, backgroundColor: GREEN_MID,
  },
  bgMid: {
    position: 'absolute', top: height * 0.3, left: 0, right: 0,
    height: height * 0.4, backgroundColor: GREEN_DARK,
  },
  waveWrap: {
    position: 'absolute', bottom: 0, left: -width * 0.3, right: -width * 0.3,
    height: height * 0.35, overflow: 'hidden',
  },
  waveEllipse: {
    position: 'absolute', bottom: -height * 0.12, left: 0, right: 0,
    height: height * 0.45, borderRadius: width * 0.8,
    backgroundColor: 'rgba(11,110,79,0.22)',
  },
  blob1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(11,110,79,0.15)', top: -70, right: -90,
  },
  blob2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(11,110,79,0.10)', bottom: 80, left: -80,
  },

  scroll: {
    flexGrow: 1, paddingHorizontal: 24,
    paddingTop: 60, paddingBottom: 40, alignItems: 'center',
  },

  logoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 40, alignSelf: 'center',
  },
  bogoLogo: {
    width: 140, height: 140, borderRadius: 16,
  },
  logoIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(232,160,32,0.15)',
    borderWidth: 1, borderColor: 'rgba(232,160,32,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { fontSize: 20, fontWeight: '800', color: WHITE, letterSpacing: -0.3 },
  logoTextGold: { color: GOLD },

  headingBlock: { alignItems: 'center', marginBottom: 28 },
  heading: {
    fontSize: 28, fontWeight: '800', color: WHITE,
    letterSpacing: -0.5, marginBottom: 6, textAlign: 'center',
  },
  headingGold: {
    fontSize: 14, fontWeight: '600', color: GOLD,
    textAlign: 'center', letterSpacing: 0.2,
  },

  card: {
    width: '100%', backgroundColor: WHITE, borderRadius: 20,
    padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25, shadowRadius: 40, elevation: 20,
    marginBottom: 28,
  },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: '#6b7280',
    marginBottom: 7, letterSpacing: 0.8,
  },
  fieldWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 11, backgroundColor: '#f9fafb',
    paddingHorizontal: 13, height: 50, minHeight: 50, maxHeight: 50,
    overflow: 'hidden',
  },
  fieldFocused: {
    borderColor: GREEN_MAIN, backgroundColor: WHITE,
    shadowColor: GREEN_MAIN, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 2,
  },
  fieldIcon: { marginRight: 9 },
  fieldInput: { flex: 1, fontSize: 15, color: '#0f172a', height: 50, textAlignVertical: 'center', paddingVertical: 0 },
  eyeBtn: { padding: 4, marginLeft: 4 },

  loginBtn: {
    height: 54, borderRadius: 10, backgroundColor: GREEN_MAIN,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 8, marginBottom: 14,
    shadowColor: GREEN_MAIN, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  loginBtnText: { color: WHITE, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  hintRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  hintText: { fontSize: 11, color: '#9ca3af' },

  trustRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 20,
  },
  trustLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  trustText: { fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.3 },

  forgotRow: { alignSelf: 'flex-end', marginTop: 4, marginBottom: 8 },
  forgotText: { color: GOLD, fontSize: 13, fontWeight: '600' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16, padding: 4 },
  registerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  registerLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  registerLink: { color: GOLD, fontSize: 13, fontWeight: '700' },
  footer: {
    textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11,
  },
});
