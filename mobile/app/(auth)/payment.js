import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useLicenseStore from '../../src/store/licenseStore';
import useAuthStore from '../../src/store/authStore';
import useLanguageStore from '../../src/store/languageStore';
import api from '../../src/services/api';

const { width } = Dimensions.get('window');
const GREEN_DARK = '#071a12';
const GREEN_MAIN = '#0B6E4F';
const GOLD = '#e8a020';
const WHITE = '#ffffff';

const PLANS = {
  basic: {
    name: 'BASIC',
    price: '100,000',
    duration: '1 mois',
    priceEur: '~152 EUR',
    icon: '🥉'
  },
  premium: {
    name: 'PREMIUM',
    price: '1,000,000',
    duration: '1 an',
    priceEur: '~1,527 EUR',
    icon: '🥇',
    savings: 'Économisez 200,000 XOF'
  }
};

export default function PaymentScreen() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const router = useRouter();

  const selectPlan = (plan) => {
    setSelectedPlan(plan);
    setSelectedMethod(null);
  };

  const selectPaymentMethod = (method) => {
    setSelectedMethod(method);
  };

  const handleUSSDPayment = async () => {
    if (!selectedPlan) {
      Alert.alert('Erreur', 'Veuillez choisir un plan');
      return;
    }

    const planData = PLANS[selectedPlan];
    const ussdCode = `#150*1*1*1341156*${planData.price.replace(/[^0-9]/g, '')}#`;
    
    Alert.alert(
      'Paiement Orange Money',
      `Composez ce code :\n\n${ussdCode}\n\nPuis entrez la référence reçue par SMS.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'J\'ai payé', 
          onPress: () => router.push({
            pathname: '/(auth)/payment-proof',
            params: { plan: selectedPlan, amount: planData.price.replace(/[^0-9]/g, '') }
          })
        }
      ]
    );
  };

  const handleStripePayment = async () => {
    if (!selectedPlan) {
      Alert.alert('Erreur', 'Veuillez choisir un plan');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/payments/stripe/create', {
        userId: user.id,
        plan: selectedPlan
      });

      if (response.data.success) {
        // Ouvrir Stripe dans le navigateur
        router.push({
          pathname: '/webview',
          params: { url: response.data.url }
        });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le paiement Stripe');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (selectedMethod === 'ussd') {
      handleUSSDPayment();
    } else if (selectedMethod === 'stripe') {
      handleStripePayment();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activation de licence</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choisissez votre plan</Text>
          
          {Object.entries(PLANS).map(([key, plan]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.planCard,
                selectedPlan === key && styles.planCardSelected
              ]}
              onPress={() => selectPlan(key)}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planIcon}>{plan.icon}</Text>
                <Text style={styles.planName}>{plan.name}</Text>
              </View>
              <Text style={styles.planDuration}>{plan.duration}</Text>
              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>{plan.price} XOF</Text>
                <Text style={styles.planPriceEur}>{plan.priceEur}</Text>
                {plan.savings && <Text style={styles.planSavings}>{plan.savings}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Methods */}
        {selectedPlan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Moyen de paiement</Text>
            
            <TouchableOpacity
              style={[
                styles.methodCard,
                selectedMethod === 'ussd' && styles.methodCardSelected
              ]}
              onPress={() => selectPaymentMethod('ussd')}
            >
              <View style={styles.methodHeader}>
                <View style={styles.methodIcon}>
                  <Ionicons name="phone-portrait" size={20} color={WHITE} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>Orange Money</Text>
                  <Text style={styles.methodDesc}>Paiement local instantané</Text>
                </View>
                <Text style={styles.methodBadge}>Recommandé</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodCard,
                selectedMethod === 'stripe' && styles.methodCardSelected
              ]}
              onPress={() => selectPaymentMethod('stripe')}
            >
              <View style={styles.methodHeader}>
                <View style={styles.methodIconStripe}>
                  <Ionicons name="card" size={20} color={WHITE} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>Carte bancaire</Text>
                  <Text style={styles.methodDesc}>Visa, Mastercard, etc.</Text>
                </View>
                <Text style={styles.methodBadgeStripe}>International</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Pay Button */}
        {selectedPlan && selectedMethod && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <>
                  <Ionicons 
                    name={selectedMethod === 'ussd' ? 'phone-portrait' : 'card'} 
                    size={20} 
                    color={WHITE} 
                  />
                  <Text style={styles.payButtonText}>
                    {selectedMethod === 'ussd' ? 'Payer avec Orange Money' : 'Payer avec Stripe'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_DARK },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: WHITE },
  section: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: WHITE, marginBottom: 16 },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  planCardSelected: {
    borderColor: GOLD,
    backgroundColor: 'rgba(232,160,32,0.1)'
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  planIcon: { fontSize: 24, marginRight: 8 },
  planName: { fontSize: 16, fontWeight: '700', color: WHITE },
  planDuration: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  planPricing: { alignItems: 'flex-end' },
  planPrice: { fontSize: 18, fontWeight: '700', color: GOLD },
  planPriceEur: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  planSavings: { fontSize: 12, color: '#4ade80', marginTop: 4 },
  methodCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  methodCardSelected: { borderColor: GOLD },
  methodHeader: { flexDirection: 'row', alignItems: 'center' },
  methodIcon: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  methodIconStripe: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 16, fontWeight: '600', color: WHITE },
  methodDesc: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  methodBadge: {
    fontSize: 11, fontWeight: '600',
    color: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
  },
  methodBadgeStripe: {
    fontSize: 11, fontWeight: '600',
    color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
  },
  payButton: {
    backgroundColor: GREEN_MAIN,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  payButtonText: { fontSize: 16, fontWeight: '600', color: WHITE }
});
