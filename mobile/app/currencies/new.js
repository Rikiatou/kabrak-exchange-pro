import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useCurrencyStore from '../../src/store/currencyStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useLanguageStore from '../../src/store/languageStore';

function FormField({ label, value, onChangeText, placeholder, keyboardType, required }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required && <Text style={{ color: COLORS.danger }}> *</Text>}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="characters"
      />
    </View>
  );
}

export default function NewCurrencyScreen() {
  const router = useRouter();
  const { t } = useLanguageStore();
  const { createCurrency } = useCurrencyStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: '', name: '', symbol: '',
    currentRate: '', buyRate: '', sellRate: '',
    stockAmount: '0', lowStockAlert: '1000'
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.code || !form.name || !form.symbol || !form.currentRate) {
      Alert.alert(t.common.error, t.common.required);
      return;
    }
    setLoading(true);
    const result = await createCurrency({
      ...form,
      currentRate: parseFloat(form.currentRate),
      buyRate: form.buyRate ? parseFloat(form.buyRate) : parseFloat(form.currentRate),
      sellRate: form.sellRate ? parseFloat(form.sellRate) : parseFloat(form.currentRate),
      stockAmount: parseFloat(form.stockAmount) || 0,
      lowStockAlert: parseFloat(form.lowStockAlert) || 1000
    });
    setLoading(false);
    if (result.success) {
      Alert.alert(t.common.success, `${result.data.code} ${t.currencies.created}`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert(t.common.error, result.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.currencies.newTitle}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.currencies.identification}</Text>
            <FormField label={t.currencies.isoCode} value={form.code} onChangeText={(v) => set('code', v.toUpperCase())} placeholder="Ex: USD, EUR, XOF" required />
            <FormField label={t.currencies.fullName} value={form.name} onChangeText={(v) => set('name', v)} placeholder="Ex: US Dollar" required />
            <FormField label={t.currencies.symbol} value={form.symbol} onChangeText={(v) => set('symbol', v)} placeholder="Ex: $, €, FCFA" required />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.currencies.exchangeRates}</Text>
            <FormField label={t.currencies.currentRate} value={form.currentRate} onChangeText={(v) => set('currentRate', v)} placeholder="Ex: 1.08" keyboardType="decimal-pad" required />
            <FormField label={t.currencies.buyRate} value={form.buyRate} onChangeText={(v) => set('buyRate', v)} placeholder="Ex: 1.075" keyboardType="decimal-pad" />
            <FormField label={t.currencies.sellRate} value={form.sellRate} onChangeText={(v) => set('sellRate', v)} placeholder="Ex: 1.085" keyboardType="decimal-pad" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.currencies.stock}</Text>
            <FormField label={t.currencies.stockAmount} value={form.stockAmount} onChangeText={(v) => set('stockAmount', v)} placeholder="0" keyboardType="decimal-pad" />
            <FormField label={t.currencies.lowStockThreshold} value={form.lowStockAlert} onChangeText={(v) => set('lowStockAlert', v)} placeholder="1000" keyboardType="decimal-pad" />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : (
              <>
                <Ionicons name="add-circle" size={20} color={COLORS.white} />
                <Text style={styles.submitBtnText}>{t.currencies.createBtn}</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingTop: 56, paddingBottom: SPACING.lg
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  scroll: { padding: SPACING.lg },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  field: { marginBottom: SPACING.md },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 48, fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary, backgroundColor: COLORS.background
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 54, gap: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6
  },
  submitBtnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' }
});
