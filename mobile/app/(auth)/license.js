import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar, ScrollView, Dimensions, Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useLicenseStore from '../../src/store/licenseStore';
import useLanguageStore from '../../src/store/languageStore';

const { width, height } = Dimensions.get('window');
const GREEN_DARK = '#071a12';
const GREEN_MID  = '#0a3d22';
const GREEN_MAIN = '#0B6E4F';
const GOLD       = '#e8a020';
const WHITE      = '#ffffff';

export default function LicenseScreen() {
  const [licenseKey, setLicenseKey] = useState('');
  const { verifyLicense, isChecking } = useLicenseStore();
  const { t, language } = useLanguageStore();
  const router = useRouter();

  const labels = {
    fr: {
      title: 'Activation de licence',
      subtitle: 'Entrez votre clé de licence pour accéder à l\'application',
      placeholder: 'XXXX-XXXX-XXXX-XXXX',
      label: 'CLÉ DE LICENCE',
      btn: 'Activer',
      noKey: 'Vous n\'avez pas de clé ?',
      contact: 'Contacter KABRAK ENG',
      errorEmpty: 'Veuillez entrer votre clé de licence.',
      errorInvalid: 'Clé invalide. Vérifiez et réessayez.',
      expired: 'Licence expirée. Veuillez renouveler votre abonnement.',
      suspended: 'Licence suspendue. Contactez le support.',
      hint: 'Format : XXXX-XXXX-XXXX-XXXX',
      success: 'Licence activée !',
      successMsg: 'Bienvenue sur KABRAK Exchange Pro.',
    },
    en: {
      title: 'License Activation',
      subtitle: 'Enter your license key to access the application',
      placeholder: 'XXXX-XXXX-XXXX-XXXX',
      label: 'LICENSE KEY',
      btn: 'Activate',
      noKey: 'Don\'t have a key?',
      contact: 'Contact KABRAK ENG',
      errorEmpty: 'Please enter your license key.',
      errorInvalid: 'Invalid key. Please check and try again.',
      expired: 'License expired. Please renew your subscription.',
      suspended: 'License suspended. Please contact support.',
      hint: 'Format: XXXX-XXXX-XXXX-XXXX',
      success: 'License activated!',
      successMsg: 'Welcome to KABRAK Exchange Pro.',
    }
  };

  const L = labels[language] || labels.fr;

  const handleActivate = async () => {
    const key = licenseKey.trim().toUpperCase();
    if (!key) {
      Alert.alert(t.common.error, L.errorEmpty);
      return;
    }
    const result = await verifyLicense(key);
    if (result.success) {
      Alert.alert(L.success, `${L.successMsg}\n${result.data.businessName}`, [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    } else {
      const msg = result.code === 'EXPIRED' ? L.expired
        : result.code === 'SUSPENDED' ? L.suspended
        : result.message || L.errorInvalid;
      Alert.alert(t.common.error, msg);
    }
  };

  const formatKey = (text) => {
    const clean = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16);
    return clean.match(/.{1,4}/g)?.join('-') || clean;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN_DARK} />
      <View style={styles.bgTop} />
      <View style={styles.bgMid} />
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoIconWrap}>
            <Ionicons name="swap-horizontal" size={20} color={GOLD} />
          </View>
          <Text style={styles.logoText}>KABRAK <Text style={{ color: GOLD }}>Exchange Pro</Text></Text>
        </View>

        {/* Shield icon */}
        <View style={styles.shieldWrap}>
          <Ionicons name="shield-checkmark" size={56} color={GOLD} />
        </View>

        <Text style={styles.title}>{L.title}</Text>
        <Text style={styles.subtitle}>{L.subtitle}</Text>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{L.label}</Text>
          <View style={styles.fieldWrapper}>
            <Ionicons name="key-outline" size={18} color={GREEN_MAIN} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.fieldInput}
              value={licenseKey}
              onChangeText={(v) => setLicenseKey(formatKey(v))}
              placeholder={L.placeholder}
              placeholderTextColor="#c4c9d4"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={19}
            />
          </View>
          <Text style={styles.hint}>{L.hint}</Text>

          <TouchableOpacity style={[styles.btn, isChecking && { opacity: 0.65 }]} onPress={handleActivate} disabled={isChecking}>
            {isChecking
              ? <ActivityIndicator color={WHITE} />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={WHITE} style={{ marginRight: 8 }} />
                  <Text style={styles.btnText}>{L.btn}</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* Contact */}
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>{L.noKey}</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://wa.me/237653561862?text=Bonjour%20KABRAK%20ENG%2C%20je%20voudrais%20obtenir%20une%20licence%20Exchange%20Pro.')}>
            <Text style={styles.contactLink}>{L.contact} 💬</Text>
          </TouchableOpacity>
        </View>

        {/* Free Trial Button */}
        <TouchableOpacity 
          style={styles.trialButton}
          onPress={() => router.push('/(auth)/payment')}
        >
          <Ionicons name="gift-outline" size={20} color={WHITE} style={{ marginRight: 8 }} />
          <Text style={styles.trialButtonText}>🎁 ESSAI GRATUIT 14 JOURS</Text>
        </TouchableOpacity>

        {/* Payment Button */}
        <TouchableOpacity 
          style={styles.paymentButton}
          onPress={() => router.push('/(auth)/payment')}
        >
          <Ionicons name="card-outline" size={20} color={WHITE} style={{ marginRight: 8 }} />
          <Text style={styles.paymentButtonText}>🔥 Activer une licence maintenant</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>KABRAK Exchange Pro v1.0 — KABRAK ENG</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_DARK },
  bgTop: { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.5, backgroundColor: GREEN_MID },
  bgMid: { position: 'absolute', top: height * 0.3, left: 0, right: 0, height: height * 0.4, backgroundColor: GREEN_DARK },
  blob1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(11,110,79,0.15)', top: -70, right: -90 },
  blob2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(11,110,79,0.10)', bottom: 80, left: -80 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32, alignSelf: 'center' },
  logoIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(232,160,32,0.15)', borderWidth: 1, borderColor: 'rgba(232,160,32,0.3)', justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 20, fontWeight: '800', color: WHITE, letterSpacing: -0.3 },
  shieldWrap: { marginBottom: 16, padding: 20, borderRadius: 50, backgroundColor: 'rgba(232,160,32,0.1)', borderWidth: 1, borderColor: 'rgba(232,160,32,0.2)' },
  title: { fontSize: 26, fontWeight: '800', color: WHITE, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  card: { width: '100%', backgroundColor: WHITE, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.25, shadowRadius: 40, elevation: 20, marginBottom: 24 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', marginBottom: 7, letterSpacing: 0.8 },
  fieldWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 11, backgroundColor: '#f9fafb', paddingHorizontal: 13, height: 52 },
  fieldInput: { flex: 1, fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: 2 },
  hint: { fontSize: 11, color: '#9ca3af', marginTop: 6, marginBottom: 20 },
  btn: { height: 54, borderRadius: 10, backgroundColor: GREEN_MAIN, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: GREEN_MAIN, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  btnText: { color: WHITE, fontSize: 16, fontWeight: '700' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  contactLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  contactLink: { color: GOLD, fontSize: 13, fontWeight: '700' },
  trialButton: {
    height: 54,
    borderRadius: 10,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 12,
    width: '100%',
  },
  trialButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  paymentButton: {
    height: 54,
    borderRadius: 10,
    backgroundColor: GOLD,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 20
  },
  paymentButtonText: { 
    color: GREEN_DARK, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11 },
});
