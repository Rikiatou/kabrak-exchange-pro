import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Keyboard
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import useAuthStore from '../../src/store/authStore';

const GREEN_DARK = '#071a12';
const GREEN_MAIN = '#0B6E4F';
const GOLD = '#e8a020';
const WHITE = '#ffffff';

export default function OTPVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userId, phone, email, password } = params;
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes
  const inputRefs = useRef([]);
  const { setToken, setUser } = useAuthStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCodeChange = (value, index) => {
    if (value.length > 1) {
      // Si on colle un code complet
      const digits = value.slice(0, 6).split('');
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (i < 6) newCode[i] = digit;
      });
      setCode(newCode);
      if (digits.length === 6) {
        Keyboard.dismiss();
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newCode.every(d => d) && newCode.join('').length === 6) {
      Keyboard.dismiss();
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode = null) => {
    const codeToVerify = otpCode || code.join('');
    
    if (codeToVerify.length !== 6) {
      Alert.alert('Erreur', 'Veuillez entrer le code à 6 chiffres');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        otpCode: codeToVerify,
      });

      if (response.data.success) {
        const { token, refreshToken, user } = response.data.data;
        await setToken(token, refreshToken);
        setUser(user);
        router.replace('/(tabs)/dashboard');
      }
    } catch (error) {
      Alert.alert(
        'Code invalide',
        error.response?.data?.message || 'Le code OTP est invalide ou expiré'
      );
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/otp/resend', { userId, type: 'login' });
      Alert.alert('✅ Code renvoyé', 'Un nouveau code a été envoyé par WhatsApp');
      setTimer(300);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Impossible de renvoyer le code'
      );
    } finally {
      setResending(false);
    }
  };

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vérification 2FA</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={64} color={GREEN_MAIN} />
        </View>

        <Text style={styles.title}>Code de vérification</Text>
        <Text style={styles.subtitle}>
          Un code à 6 chiffres a été envoyé par{'\n'}
          <Text style={styles.phone}>📱 WhatsApp</Text> au{'\n'}
          <Text style={styles.phone}>{phone || '***'}</Text>
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[styles.codeInput, digit && styles.codeInputFilled]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {timer > 0 ? (
          <Text style={styles.timer}>
            Code expire dans {minutes}:{seconds.toString().padStart(2, '0')}
          </Text>
        ) : (
          <Text style={styles.expired}>⚠️ Code expiré</Text>
        )}

        <TouchableOpacity
          style={[styles.verifyBtn, loading && { opacity: 0.6 }]}
          onPress={() => handleVerify()}
          disabled={loading || code.some(d => !d)}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={WHITE} />
              <Text style={styles.verifyBtnText}>Vérifier</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendBtn}
          onPress={handleResend}
          disabled={resending || timer > 240}
        >
          {resending ? (
            <ActivityIndicator size="small" color={GREEN_MAIN} />
          ) : (
            <Text style={[styles.resendText, timer > 240 && { opacity: 0.4 }]}>
              Renvoyer le code
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GREEN_DARK,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: WHITE },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${GREEN_MAIN}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  phone: {
    fontWeight: '700',
    color: GREEN_MAIN,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: WHITE,
  },
  codeInputFilled: {
    borderColor: GREEN_MAIN,
    backgroundColor: `${GREEN_MAIN}08`,
  },
  timer: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 24,
  },
  expired: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '600',
    marginBottom: 24,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: GREEN_MAIN,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 16,
    minWidth: 200,
    justifyContent: 'center',
  },
  verifyBtnText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  resendBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resendText: {
    color: GREEN_MAIN,
    fontSize: 14,
    fontWeight: '600',
  },
});
