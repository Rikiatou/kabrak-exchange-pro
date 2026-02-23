import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../src/store/authStore';
import useLicenseStore from '../../src/store/licenseStore';
import api from '../../src/services/api';

const GREEN_DARK = '#071a12';
const GREEN_MAIN = '#0B6E4F';
const GOLD = '#e8a020';
const WHITE = '#ffffff';

export default function PaymentProofScreen() {
  const [reference, setReference] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { verifyLicense } = useLicenseStore();
  const router = useRouter();
  const { plan, amount } = useLocalSearchParams();

  const handleSubmit = async () => {
    if (!reference.trim() || !phoneNumber.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/payments/ussd-proof', {
        userId: user.id,
        plan,
        amount: parseInt(amount),
        reference: reference.trim(),
        phoneNumber: phoneNumber.trim()
      });

      if (response.data.success) {
        // Si licence créée automatiquement (trial), la charger
        if (response.data.license?.licenseKey) {
          await verifyLicense(response.data.license.licenseKey);
          Alert.alert(
            '✅ Licence activée !',
            `Votre licence est active.\nClé : ${response.data.license.licenseKey}`,
            [{ text: 'Commencer', onPress: () => router.replace('/(auth)/login') }]
          );
        } else {
          Alert.alert(
            'Transaction ID envoyé !',
            'Votre Transaction ID a été enregistré. Un administrateur va valider votre paiement sous 24h. Vous recevrez votre clé de licence par email.',
            [{ text: 'OK', onPress: () => router.replace('/(auth)/license') }]
          );
        }
      }
    } catch (error) {
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Impossible d\'envoyer la preuve de paiement'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmation de paiement</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <View style={styles.instructionIcon}>
            <Ionicons name="information-circle" size={24} color={GOLD} />
          </View>
          <Text style={styles.instructionText}>
            Entrez la référence du SMS reçu et le numéro utilisé pour le paiement
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Transaction ID (SMS Orange Money)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={18} color={GREEN_MAIN} />
              <TextInput
                style={styles.input}
                value={reference}
                onChangeText={setReference}
                placeholder="PP260220.2301.D61601NN"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Numéro de téléphone</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="phone-portrait-outline" size={18} color={GREEN_MAIN} />
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+237699123456"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <>
              <Ionicons name="send-outline" size={20} color={WHITE} />
              <Text style={styles.submitButtonText}>Envoyer pour validation</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Help */}
        <View style={styles.help}>
          <Text style={styles.helpText}>
            Vous recevrez une confirmation dès que votre paiement sera validé.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_DARK },
  content: { flex: 1, padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingTop: 60
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: WHITE },
  instructions: {
    backgroundColor: 'rgba(232,160,32,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center'
  },
  instructionIcon: { marginRight: 12 },
  instructionText: { 
    fontSize: 14, 
    color: WHITE, 
    flex: 1,
    lineHeight: 20
  },
  form: { marginBottom: 32 },
  field: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
    marginBottom: 8
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 52
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: WHITE,
    marginLeft: 12
  },
  submitButton: {
    backgroundColor: GREEN_MAIN,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE
  },
  help: {
    alignItems: 'center'
  },
  helpText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 18
  }
});
