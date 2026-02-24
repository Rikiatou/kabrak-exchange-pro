import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useCurrencyStore from '../../src/store/currencyStore';
import useAuthStore from '../../src/store/authStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useLanguageStore from '../../src/store/languageStore';
import { formatCurrency, formatDateTime } from '../../src/utils/helpers';
import { ActivityIndicator as Spinner, Modal } from 'react-native';

export default function CurrencyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchCurrencyById, updateCurrency, getLiveRates } = useCurrencyStore();
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.teamRole === 'owner' || user?.teamRole === 'manager';

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAdj, setStockAdj] = useState('');
  const [stockType, setStockType] = useState('set');
  const [savingStock, setSavingStock] = useState(false);
  const { adjustStock } = useCurrencyStore();

  const [currency, setCurrency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveDate, setLiveDate] = useState(null);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    setLoading(true);
    const data = await fetchCurrencyById(id);
    if (data) {
      setCurrency(data);
      setForm({
        currentRate: String(data.currentRate),
        buyRate: String(data.buyRate || data.currentRate),
        sellRate: String(data.sellRate || data.currentRate),
        stockAmount: String(data.stockAmount),
        lowStockAlert: String(data.lowStockAlert)
      });
    }
    setLoading(false);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFetchLive = async () => {
    setLoadingLive(true);
    const result = await getLiveRates('EUR');
    setLoadingLive(false);
    if (!result.success) { Alert.alert('Erreur', result.message); return; }
    const rates = result.data.rates;
    const code = currency.code.toUpperCase();
    const rate = rates[code];
    if (!rate) { Alert.alert('Introuvable', `Taux en direct non disponible pour ${code}`); return; }
    const buyRate = parseFloat((rate * 0.995).toFixed(6));
    const sellRate = parseFloat((rate * 1.005).toFixed(6));
    setForm(f => ({ ...f, currentRate: String(rate), buyRate: String(buyRate), sellRate: String(sellRate) }));
    setLiveDate(result.data.date);
    Alert.alert('✅ Taux mis à jour', `Taux en direct du ${result.data.date}\n1 EUR = ${rate} ${code}`);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateCurrency(id, {
      currentRate: parseFloat(form.currentRate),
      buyRate: parseFloat(form.buyRate),
      sellRate: parseFloat(form.sellRate),
      stockAmount: parseFloat(form.stockAmount),
      lowStockAlert: parseFloat(form.lowStockAlert)
    });
    setSaving(false);
    if (result.success) {
      Alert.alert(t.common.success, t.currencies.updated);
      setCurrency(result.data);
      setEditing(false);
    } else {
      Alert.alert(t.common.error, result.message);
    }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!currency) return null;

  const isLowStock = parseFloat(currency.stockAmount) <= parseFloat(currency.lowStockAlert);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{currency.code} — {currency.name}</Text>
          {canEdit && (
            <TouchableOpacity onPress={() => setEditing(!editing)} style={styles.editBtn}>
              <Ionicons name={editing ? 'close-outline' : 'pencil-outline'} size={22} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Currency Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{currency.code}</Text>
            </View>
            <View>
              <Text style={styles.heroName}>{currency.name}</Text>
              <Text style={styles.heroSymbol}>{currency.symbol}</Text>
            </View>
          </View>
          <View style={[styles.stockBadge, { backgroundColor: isLowStock ? COLORS.dangerLight : COLORS.successLight }]}>
            <Ionicons name={isLowStock ? 'warning-outline' : 'checkmark-circle-outline'} size={14} color={isLowStock ? COLORS.danger : COLORS.success} />
            <Text style={[styles.stockText, { color: isLowStock ? COLORS.danger : COLORS.success }]}>
              {isLowStock ? t.currencies.lowStock : t.currencies.stockOk}
            </Text>
          </View>
        </View>

        {/* Rates */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.currencies.exchangeRates}</Text>
          {editing ? (
            <>
              <TouchableOpacity style={styles.liveBtn} onPress={handleFetchLive} disabled={loadingLive}>
                {loadingLive
                  ? <Spinner size="small" color={COLORS.white} />
                  : <Ionicons name="globe-outline" size={16} color={COLORS.white} />}
                <Text style={styles.liveBtnText}>{loadingLive ? 'Chargement...' : 'Taux en direct (EUR)'}</Text>
              </TouchableOpacity>
              {liveDate && <Text style={styles.liveDate}>Source: frankfurter.app — {liveDate}</Text>}
              {[
                { key: 'currentRate', label: t.currencies.currentRate },
                { key: 'buyRate', label: t.currencies.buyRate },
                { key: 'sellRate', label: t.currencies.sellRate }
              ].map((f) => (
                <View key={f.key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={form[f.key]}
                    onChangeText={(v) => set(f.key, v)}
                    keyboardType="decimal-pad"
                    placeholder="0.000000"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              ))}
            </>
          ) : (
            <>
              <View style={styles.rateRow}>
                <View style={styles.rateItem}>
                  <Text style={styles.rateLabel}>{t.currencies.currentRate}</Text>
                  <Text style={styles.rateValue}>{parseFloat(currency.currentRate).toFixed(6)}</Text>
                </View>
                <View style={styles.rateItem}>
                  <Text style={[styles.rateLabel, { color: COLORS.success }]}>{t.currencies.buyRate}</Text>
                  <Text style={[styles.rateValue, { color: COLORS.success }]}>{parseFloat(currency.buyRate || currency.currentRate).toFixed(6)}</Text>
                </View>
                <View style={styles.rateItem}>
                  <Text style={[styles.rateLabel, { color: COLORS.danger }]}>{t.currencies.sellRate}</Text>
                  <Text style={[styles.rateValue, { color: COLORS.danger }]}>{parseFloat(currency.sellRate || currency.currentRate).toFixed(6)}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Stock */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📦 Stock physique en caisse</Text>
          {editing ? (
            <>
              {[
                { key: 'stockAmount', label: t.currencies.stockAmount },
                { key: 'lowStockAlert', label: t.currencies.lowStockThreshold }
              ].map((f) => (
                <View key={f.key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={form[f.key]}
                    onChangeText={(v) => set(f.key, v)}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              ))}
            </>
          ) : (
            <View>
              <View style={styles.stockRow}>
                <View style={[styles.stockCard, { backgroundColor: isLowStock ? COLORS.dangerLight : COLORS.successLight }]}>
                  <Text style={styles.stockLabel}>{t.currencies.stockAmount}</Text>
                  <Text style={[styles.stockAmount, { color: isLowStock ? COLORS.danger : COLORS.success }]}>
                    {formatCurrency(currency.stockAmount, currency.code)}
                  </Text>
                </View>
                <View style={[styles.stockCard, { backgroundColor: COLORS.warningLight }]}>
                  <Text style={styles.stockLabel}>{t.currencies.lowStockThreshold}</Text>
                  <Text style={[styles.stockAmount, { color: COLORS.warning }]}>
                    {formatCurrency(currency.lowStockAlert, currency.code)}
                  </Text>
                </View>
              </View>
              {canEdit && (
                <TouchableOpacity
                  style={styles.stockAdjBtn}
                  onPress={() => { setStockAdj(''); setStockType('set'); setShowStockModal(true); }}
                >
                  <Ionicons name="cube-outline" size={16} color={COLORS.white} />
                  <Text style={styles.stockAdjBtnText}>Ajuster le stock</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Rate History */}
        {currency.history?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.currencies.lastUpdated}</Text>
            {currency.history.slice(0, 10).map((h) => (
              <View key={h.id} style={styles.historyRow}>
                <Text style={styles.historyDate}>{formatDateTime(h.createdAt)}</Text>
                <View style={styles.historyRates}>
                  <Text style={styles.historyRate}>{parseFloat(h.rate).toFixed(4)}</Text>
                  {h.buyRate && <Text style={[styles.historyRate, { color: COLORS.success }]}>A:{parseFloat(h.buyRate).toFixed(4)}</Text>}
                  {h.sellRate && <Text style={[styles.historyRate, { color: COLORS.danger }]}>V:{parseFloat(h.sellRate).toFixed(4)}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Stock Adjustment Modal */}
        <Modal visible={showStockModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={styles.modalTitle}>Ajuster stock — {currency?.code}</Text>
                <TouchableOpacity onPress={() => setShowStockModal(false)}>
                  <Ionicons name="close" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
                Stock actuel : <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>{formatCurrency(currency?.stockAmount, currency?.code)}</Text>
              </Text>
              {/* Type selector */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {[{ v: 'set', label: 'Définir' }, { v: 'add', label: '+ Ajouter' }, { v: 'subtract', label: '- Retirer' }].map(opt => (
                  <TouchableOpacity
                    key={opt.v}
                    style={[styles.typeBtn, stockType === opt.v && styles.typeBtnActive]}
                    onPress={() => setStockType(opt.v)}
                  >
                    <Text style={[styles.typeBtnText, stockType === opt.v && { color: COLORS.white }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.modalInput}
                placeholder={stockType === 'set' ? 'Nouveau stock total...' : 'Montant...'}
                placeholderTextColor={COLORS.textMuted}
                value={stockAdj}
                onChangeText={setStockAdj}
                keyboardType="decimal-pad"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.modalSaveBtn, { opacity: savingStock ? 0.6 : 1 }]}
                disabled={savingStock || !stockAdj}
                onPress={async () => {
                  setSavingStock(true);
                  const r = await adjustStock(currency.id, parseFloat(stockAdj), stockType);
                  setSavingStock(false);
                  if (r.success) {
                    setShowStockModal(false);
                    load();
                  } else {
                    Alert.alert('Erreur', r.message);
                  }
                }}
              >
                {savingStock
                  ? <Spinner size="small" color={COLORS.white} />
                  : <Text style={styles.modalSaveBtnText}>Enregistrer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Save Button */}
        {editing && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.white} /> : (
              <>
                <Ionicons name="save-outline" size={20} color={COLORS.white} />
                <Text style={styles.saveBtnText}>{t.common.save}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingTop: 56, paddingBottom: SPACING.lg
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white, flex: 1, textAlign: 'center' },
  editBtn: { padding: 4 },
  heroCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  codeBox: {
    width: 60, height: 60, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center'
  },
  codeText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md },
  heroName: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  heroSymbol: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, marginTop: 2 },
  stockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full
  },
  stockText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.sm,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  rateRow: { flexDirection: 'row', justifyContent: 'space-around' },
  rateItem: { alignItems: 'center' },
  rateLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 4 },
  rateValue: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  stockRow: { flexDirection: 'row', gap: SPACING.sm },
  stockCard: { flex: 1, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  stockLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 4 },
  stockAmount: { fontSize: FONTS.sizes.md, fontWeight: '700' },
  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider
  },
  historyDate: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  historyRates: { flexDirection: 'row', gap: SPACING.sm },
  historyRate: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  field: { marginBottom: SPACING.md },
  fieldLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 48, fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary, backgroundColor: COLORS.background
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 54, gap: 8,
    marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6
  },
  saveBtnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  liveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#0369a1', borderRadius: RADIUS.md, height: 42,
    marginBottom: SPACING.md,
  },
  liveBtnText: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  liveDate: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.sm },
  stockAdjBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 10, marginTop: 12 },
  stockAdjBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SPACING.lg, paddingBottom: 40 },
  modalTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  modalInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, height: 52, fontSize: FONTS.sizes.lg, color: COLORS.textPrimary, backgroundColor: COLORS.background, marginBottom: 14 },
  modalSaveBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 52, alignItems: 'center', justifyContent: 'center' },
  modalSaveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
});
