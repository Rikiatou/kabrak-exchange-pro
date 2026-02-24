import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Alert, StatusBar, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useLanguageStore from '../../src/store/languageStore';
import api from '../../src/services/api';

const { width } = Dimensions.get('window');
const GREEN_DARK = '#071a12';
const GREEN_MID  = '#0a3d22';
const GREEN_MAIN = '#0B6E4F';
const GOLD       = '#e8a020';
const WHITE      = '#ffffff';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const fr = language === 'fr';

  // Steps: 'email' -> 'code' -> 'newPassword' -> 'done'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert(fr ? 'Erreur' : 'Error', fr ? 'Veuillez entrer votre email.' : 'Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      if (data.success && data.data?.resetToken) {
        setResetToken(data.data.resetToken);
        setStep('code');
        Alert.alert(
          fr ? 'Code envoyé' : 'Code sent',
          fr ? 'Un code de réinitialisation a été envoyé à votre email.' : 'A reset code has been sent to your email.'
        );
      } else {
        Alert.alert(
          fr ? 'Info' : 'Info',
          fr ? 'Si cet email existe, un code a été envoyé.' : 'If this email exists, a code has been sent.'
        );
      }
    } catch (e) {
      Alert.alert(fr ? 'Erreur' : 'Error', e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (!code.trim() || code.trim().length !== 6) {
      Alert.alert(fr ? 'Erreur' : 'Error', fr ? 'Veuillez entrer le code à 6 chiffres.' : 'Please enter the 6-digit code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert(fr ? 'Erreur' : 'Error', fr ? 'Le mot de passe doit contenir au moins 6 caractères.' : 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(fr ? 'Erreur' : 'Error', fr ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        resetToken,
        code: code.trim(),
        newPassword,
      });
      if (data.success) {
        setStep('done');
      } else {
        Alert.alert(fr ? 'Erreur' : 'Error', data.message);
      }
    } catch (e) {
      Alert.alert(fr ? 'Erreur' : 'Error', e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN_DARK} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => step === 'email' ? router.back() : setStep('email')}>
            <Ionicons name="arrow-back" size={22} color={WHITE} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name={step === 'done' ? 'checkmark-circle' : 'lock-closed'} size={48} color={step === 'done' ? GREEN_MAIN : GOLD} />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {step === 'done'
              ? (fr ? 'Mot de passe réinitialisé !' : 'Password reset!')
              : (fr ? 'Mot de passe oublié' : 'Forgot password')}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'email' && (fr ? 'Entrez votre email pour recevoir un code de réinitialisation.' : 'Enter your email to receive a reset code.')}
            {step === 'code' && (fr ? 'Entrez le code reçu par email et votre nouveau mot de passe.' : 'Enter the code from your email and your new password.')}
            {step === 'done' && (fr ? 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.' : 'You can now log in with your new password.')}
          </Text>

          {/* Step: Email */}
          {step === 'email' && (
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.fieldWrap}>
                <Ionicons name="mail-outline" size={18} color="#9ca3af" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder={fr ? 'votre@email.com' : 'your@email.com'}
                  placeholderTextColor="#6b7280"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="send"
                  onSubmitEditing={handleSendCode}
                />
              </View>
              <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.65 }]} onPress={handleSendCode} disabled={loading}>
                {loading ? <ActivityIndicator color={WHITE} size="small" /> : (
                  <Text style={styles.primaryBtnText}>{fr ? 'Envoyer le code' : 'Send code'}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step: Code + New Password */}
          {step === 'code' && (
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>{fr ? 'Code à 6 chiffres' : '6-digit code'}</Text>
              <View style={styles.fieldWrap}>
                <Ionicons name="keypad-outline" size={18} color="#9ca3af" style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.fieldInput, { letterSpacing: 6, fontSize: 20, fontWeight: '700' }]}
                  placeholder="000000"
                  placeholderTextColor="#6b7280"
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>{fr ? 'Nouveau mot de passe' : 'New password'}</Text>
              <View style={styles.fieldWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  placeholder={fr ? 'Min. 6 caractères' : 'Min. 6 characters'}
                  placeholderTextColor="#6b7280"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>{fr ? 'Confirmer' : 'Confirm'}</Text>
              <View style={styles.fieldWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  placeholder={fr ? 'Confirmer mot de passe' : 'Confirm password'}
                  placeholderTextColor="#6b7280"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyAndReset}
                />
              </View>

              <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.65 }]} onPress={handleVerifyAndReset} disabled={loading}>
                {loading ? <ActivityIndicator color={WHITE} size="small" /> : (
                  <Text style={styles.primaryBtnText}>{fr ? 'Réinitialiser' : 'Reset password'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendRow} onPress={handleSendCode} disabled={loading}>
                <Text style={styles.resendText}>{fr ? 'Renvoyer le code' : 'Resend code'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.primaryBtnText}>{fr ? 'Se connecter' : 'Go to login'}</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_DARK },
  scroll: {
    flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40, alignItems: 'center',
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20, padding: 4 },
  iconWrap: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: GREEN_MID,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  title: { color: WHITE, fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  formCard: {
    width: '100%', backgroundColor: GREEN_MID, borderRadius: 16, padding: 24,
  },
  fieldLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, height: 50,
  },
  fieldInput: { flex: 1, color: WHITE, fontSize: 15 },
  primaryBtn: {
    width: '100%', height: 52, borderRadius: 10, backgroundColor: GREEN_MAIN,
    justifyContent: 'center', alignItems: 'center', marginTop: 20,
    shadowColor: GREEN_MAIN, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  primaryBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },
  resendRow: { alignSelf: 'center', marginTop: 16 },
  resendText: { color: GOLD, fontSize: 13, fontWeight: '600' },
});
