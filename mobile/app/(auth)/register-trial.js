import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, StatusBar, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import useLicenseStore from '../../src/store/licenseStore';
import * as SecureStore from 'expo-secure-store';
import { getDeviceId } from '../../src/utils/deviceId';

const { width } = Dimensions.get('window');
const GREEN_DARK = '#071a12';
const GREEN_MID  = '#0a3d22';
const GREEN_MAIN = '#0B6E4F';
const GOLD       = '#e8a020';
const WHITE      = '#ffffff';

export default function RegisterTrialScreen() {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [phone, setPhone]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [showPass, setShowPass]         = useState(false);
  const router = useRouter();
  const { verifyLicense } = useLicenseStore();

  const handleTrial = async () => {
    if (!businessName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      // Get device ID for trial abuse protection
      const deviceId = await getDeviceId();
      
      // 1. Créer le compte
      const registerRes = await api.post('/auth/register', {
        businessName: businessName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        firstName: businessName.trim(),
        lastName: '',
        deviceId, // Include device ID
      });

      const { token, user } = registerRes.data.data || registerRes.data;
      if (token) {
        await SecureStore.setItemAsync('auth_token', token);
      }

      // 2. Activer le trial automatiquement
      const trialRes = await api.post('/payments/ussd-proof', {
        userId: user.id,
        plan: 'trial',
        amount: 0,
        reference: 'TRIAL-' + Date.now(),
        phoneNumber: phone.trim() || '+237000000000',
        deviceId, // Include device ID
      });

      if (trialRes.data.success && trialRes.data.license) {
        // 3. Vérifier et stocker la licence
        const licenseKey = trialRes.data.license.licenseKey;
        await verifyLicense(licenseKey);

        Alert.alert(
          '🎉 Essai gratuit activé !',
          `Bienvenue ${businessName} !\n\nVous avez 14 jours d'accès gratuit.\nVotre clé : ${licenseKey}`,
          [{ text: 'Commencer', onPress: () => router.replace('/(auth)/login') }]
        );
      } else {
        Alert.alert(
          'Compte créé !',
          'Votre compte a été créé. Contactez le support pour activer votre essai gratuit.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/license') }]
        );
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Erreur lors de l\'inscription.';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN_DARK} />
      <View style={styles.bgTop} />
      <View style={styles.bgMid} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={WHITE} />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoIconWrap}>
            <Ionicons name="swap-horizontal" size={20} color={GOLD} />
          </View>
          <Text style={styles.logoText}>KABRAK <Text style={{ color: GOLD }}>Exchange Pro</Text></Text>
        </View>

        {/* Badge trial */}
        <View style={styles.trialBadge}>
          <Ionicons name="gift" size={20} color={GOLD} />
          <Text style={styles.trialBadgeText}>ESSAI GRATUIT — 14 JOURS</Text>
        </View>

        <Text style={styles.title}>Créez votre compte</Text>
        <Text style={styles.subtitle}>Accès complet pendant 14 jours, sans carte bancaire.</Text>

        {/* Form */}
        <View style={styles.card}>
          {/* Business Name */}
          <Text style={styles.label}>NOM DU BUREAU DE CHANGE *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="business-outline" size={18} color={GREEN_MAIN} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Ex: Change Express Douala"
              placeholderTextColor="#c4c9d4"
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>EMAIL *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={GREEN_MAIN} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              placeholderTextColor="#c4c9d4"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <Text style={styles.label}>TÉLÉPHONE (optionnel)</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={18} color={GREEN_MAIN} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+237699123456"
              placeholderTextColor="#c4c9d4"
              keyboardType="phone-pad"
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>MOT DE PASSE *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={GREEN_MAIN} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 caractères"
              placeholderTextColor="#c4c9d4"
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.65 }]}
            onPress={handleTrial}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={WHITE} />
              : <>
                  <Ionicons name="gift-outline" size={20} color={WHITE} style={{ marginRight: 8 }} />
                  <Text style={styles.btnText}>DÉMARRER MON ESSAI GRATUIT</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* Already have account */}
        <View style={styles.loginRow}>
          <Text style={styles.loginLabel}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>KABRAK Exchange Pro v1.0 — KABRAK ENG</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_DARK },
  bgTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: GREEN_MID },
  bgMid: { position: 'absolute', top: '30%', left: 0, right: 0, height: '40%', backgroundColor: GREEN_DARK },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 16, padding: 4 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, alignSelf: 'center' },
  logoIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(232,160,32,0.15)', borderWidth: 1, borderColor: 'rgba(232,160,32,0.3)', justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 20, fontWeight: '800', color: WHITE, letterSpacing: -0.3 },
  trialBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(232,160,32,0.15)', borderWidth: 1, borderColor: 'rgba(232,160,32,0.3)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  trialBadgeText: { color: GOLD, fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '800', color: WHITE, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  card: { width: '100%', backgroundColor: WHITE, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.25, shadowRadius: 40, elevation: 20, marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '700', color: '#6b7280', marginBottom: 6, letterSpacing: 0.8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 11, backgroundColor: '#f9fafb', paddingHorizontal: 13, height: 52, marginBottom: 16 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#0f172a' },
  btn: { height: 54, borderRadius: 10, backgroundColor: '#10b981', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  btnText: { color: WHITE, fontSize: 15, fontWeight: '700' },
  loginRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  loginLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  loginLink: { color: GOLD, fontSize: 13, fontWeight: '700' },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11 },
});
