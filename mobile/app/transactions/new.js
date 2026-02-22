import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useTransactionStore from '../../src/store/transactionStore';
import useClientStore from '../../src/store/clientStore';
import useCurrencyStore from '../../src/store/currencyStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useLanguageStore from '../../src/store/languageStore';
import { formatCurrency } from '../../src/utils/helpers';

export default function NewTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { createTransaction } = useTransactionStore();
  const { clients, fetchClients } = useClientStore();
  const { currencies, fetchCurrencies } = useCurrencyStore();
  const { t } = useLanguageStore();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clientId: params.clientId || '',
    currencyFrom: 'EUR',
    currencyTo: 'USD',
    amountFrom: '',
    exchangeRate: '',
    type: 'sell',
    notes: '',
    dueDate: ''
  });
  const [amountTo, setAmountTo] = useState(0);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => {
    fetchClients();
    fetchCurrencies();
  }, []);

  useEffect(() => {
    const from = parseFloat(form.amountFrom) || 0;
    const rate = parseFloat(form.exchangeRate) || 0;
    setAmountTo(from * rate);
  }, [form.amountFrom, form.exchangeRate]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const selectedClient = clients.find((c) => c.id === form.clientId);
  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone && c.phone.includes(clientSearch))
  );

  const handleSubmit = async () => {
    if (!form.clientId) return Alert.alert(t.common.error, t.transactions.client + ' ' + t.common.required);
    if (!form.amountFrom || parseFloat(form.amountFrom) <= 0) return Alert.alert(t.common.error, t.transactions.invalidAmount);
    if (!form.exchangeRate || parseFloat(form.exchangeRate) <= 0) return Alert.alert(t.common.error, t.transactions.invalidAmount);
    if (form.currencyFrom === form.currencyTo) return Alert.alert(t.common.error, t.transactions.invalidAmount);

    setLoading(true);
    const result = await createTransaction({
      ...form,
      amountFrom: parseFloat(form.amountFrom),
      exchangeRate: parseFloat(form.exchangeRate)
    });
    setLoading(false);

    if (result.success) {
      Alert.alert(t.transactions.created, `${t.transactions.reference}: ${result.data.reference}`, [
        { text: t.transactions.title, onPress: () => router.replace(`/transactions/${result.data.id}`) },
        { text: t.transactions.new, onPress: () => setForm({ clientId: '', currencyFrom: 'EUR', currencyTo: 'USD', amountFrom: '', exchangeRate: '', type: 'sell', notes: '', dueDate: '' }) }
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
          <Text style={styles.headerTitle}>{t.transactions.newTitle}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Client Selector */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.transactions.client}</Text>
            <TouchableOpacity style={styles.clientSelector} onPress={() => setShowClientPicker(!showClientPicker)}>
              {selectedClient ? (
                <View style={styles.selectedClient}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>{selectedClient.name[0].toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.clientName}>{selectedClient.name}</Text>
                    <Text style={styles.clientPhone}>{selectedClient.phone || '-'}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.clientPlaceholder}>{t.transactions.selectClient}</Text>
              )}
              <Ionicons name={showClientPicker ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {showClientPicker && (
              <View style={styles.clientDropdown}>
                <TextInput
                  style={styles.clientSearch}
                  placeholder={t.transactions.searchClient}
                  placeholderTextColor={COLORS.textMuted}
                  value={clientSearch}
                  onChangeText={setClientSearch}
                />
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {filteredClients.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.clientOption}
                      onPress={() => { set('clientId', c.id); setShowClientPicker(false); setClientSearch(''); }}
                    >
                      <Text style={styles.clientOptionName}>{c.name}</Text>
                      <Text style={styles.clientOptionPhone}>{c.phone || '-'}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.newClientBtn} onPress={() => router.push('/clients/new')}>
                  <Ionicons name="person-add-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.newClientBtnText}>{t.transactions.newClient}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Exchange Details */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.transactions.exchangeDetail}</Text>

            {/* Currency From */}
            <View style={styles.field}>
              <Text style={styles.label}>{t.transactions.currencyGiven} <Text style={{ color: COLORS.danger }}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll}>
                {currencies.map((c) => (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.currencyChip, form.currencyFrom === c.code && styles.currencyChipActive]}
                    onPress={() => set('currencyFrom', c.code)}
                  >
                    <Text style={[styles.currencyChipText, form.currencyFrom === c.code && styles.currencyChipTextActive]}>
                      {c.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t.transactions.amountGiven} <Text style={{ color: COLORS.danger }}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={form.amountFrom}
                onChangeText={(v) => set('amountFrom', v)}
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Currency To */}
            <View style={styles.field}>
              <Text style={styles.label}>{t.transactions.currencyReceived} <Text style={{ color: COLORS.danger }}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll}>
                {currencies.map((c) => (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.currencyChip, form.currencyTo === c.code && styles.currencyChipActive]}
                    onPress={() => set('currencyTo', c.code)}
                  >
                    <Text style={[styles.currencyChipText, form.currencyTo === c.code && styles.currencyChipTextActive]}>
                      {c.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t.transactions.exchangeRate} <Text style={{ color: COLORS.danger }}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={form.exchangeRate}
                onChangeText={(v) => set('exchangeRate', v)}
                placeholder="Ex: 1.08"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Preview */}
            {amountTo > 0 && (
              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>{t.transactions.amountToReceive}</Text>
                <Text style={styles.previewAmount}>{formatCurrency(amountTo, form.currencyTo)}</Text>
                <Text style={styles.previewRate}>
                  1 {form.currencyFrom} = {parseFloat(form.exchangeRate || 0).toFixed(4)} {form.currencyTo}
                </Text>
              </View>
            )}
          </View>

          {/* Type */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.transactions.operationType}</Text>
            <View style={styles.typeRow}>
              {[{ key: 'sell', label: t.transactions.sell, icon: 'arrow-up-circle-outline' },
                { key: 'buy', label: t.transactions.buy, icon: 'arrow-down-circle-outline' },
                { key: 'transfer', label: t.transactions.transfer, icon: 'swap-horizontal-outline' }
              ].map((op) => (
                <TouchableOpacity
                  key={op.key}
                  style={[styles.typeBtn, form.type === op.key && styles.typeBtnActive]}
                  onPress={() => set('type', op.key)}
                >
                  <Ionicons name={op.icon} size={18} color={form.type === op.key ? COLORS.white : COLORS.textSecondary} />
                  <Text style={[styles.typeBtnText, form.type === op.key && styles.typeBtnTextActive]}>{op.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.transactions.notesOptional}</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={form.notes}
              onChangeText={(v) => set('notes', v)}
              placeholder={t.transactions.notesPlaceholder}
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : (
              <>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
                <Text style={styles.submitBtnText}>{t.transactions.createBtn}</Text>
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
  clientSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    padding: SPACING.md, backgroundColor: COLORS.background
  },
  selectedClient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  clientAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center'
  },
  clientAvatarText: { color: COLORS.white, fontWeight: '700' },
  clientName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary },
  clientPhone: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  clientPlaceholder: { fontSize: FONTS.sizes.md, color: COLORS.textMuted },
  clientDropdown: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    marginTop: SPACING.sm, overflow: 'hidden'
  },
  clientSearch: {
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 44, fontSize: FONTS.sizes.md, color: COLORS.textPrimary
  },
  clientOption: {
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider
  },
  clientOptionName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary },
  clientOptionPhone: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  newClientBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: SPACING.md, backgroundColor: COLORS.infoLight
  },
  newClientBtnText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  field: { marginBottom: SPACING.md },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 48, fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary, backgroundColor: COLORS.background
  },
  inputMultiline: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  currencyScroll: { marginTop: 4 },
  currencyChip: {
    paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.border, marginRight: SPACING.sm, backgroundColor: COLORS.background
  },
  currencyChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  currencyChipText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary },
  currencyChipTextActive: { color: COLORS.white },
  previewBox: {
    backgroundColor: COLORS.infoLight, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm
  },
  previewLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: 4 },
  previewAmount: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.primary },
  previewRate: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 4 },
  typeRow: { flexDirection: 'row', gap: SPACING.sm },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border
  },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  typeBtnTextActive: { color: COLORS.white },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 54, gap: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6
  },
  submitBtnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' }
});
