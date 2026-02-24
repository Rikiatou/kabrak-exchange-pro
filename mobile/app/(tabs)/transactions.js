import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, Modal, ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useTransactionStore from '../../src/store/transactionStore';
import useLanguageStore from '../../src/store/languageStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import { formatCurrency, formatDate, getStatusConfig } from '../../src/utils/helpers';


function TransactionCard({ tx, onPress, remainingLabel }) {
  const status = getStatusConfig(tx.status);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <View style={styles.refRow}>
          <Text style={styles.ref}>{tx.reference}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.date}>{formatDate(tx.createdAt)}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.clientRow}>
          <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.clientName} numberOfLines={1}>{tx.client?.name || '-'}</Text>
        </View>
        <View style={styles.exchangeRow}>
          <Text style={styles.fromAmount}>{formatCurrency(tx.amountFrom, tx.currencyFrom)}</Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.textMuted} />
          <Text style={styles.toAmount}>{formatCurrency(tx.amountTo, tx.currencyTo)}</Text>
        </View>
      </View>
      {tx.status !== 'paid' && (
        <View style={styles.cardFooter}>
          <Text style={styles.remainingLabel}>{remainingLabel}:</Text>
          <Text style={styles.remainingAmount}>{formatCurrency(tx.amountRemaining, tx.currencyTo)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const COMMON_CURRENCIES = ['EUR', 'USD', 'GBP', 'XOF', 'XAF', 'GNF', 'CDF', 'MAD', 'DZD', 'NGN', 'GHS'];

export default function TransactionsScreen() {
  const params = useLocalSearchParams();
  const [activeFilter, setActiveFilter] = useState(params.status || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [adv, setAdv] = useState({
    dateFrom: params.dateFrom || '',
    dateTo: params.dateTo || '',
    currencyFrom: '',
    currencyTo: '',
    amountMin: '',
    amountMax: '',
  });

  const { transactions, isLoading, fetchTransactions } = useTransactionStore();
  const { t } = useLanguageStore();
  const router = useRouter();
  const STATUS_FILTERS = [
    { key: '', label: t.transactions.filterAll },
    { key: 'unpaid', label: t.transactions.filterUnpaid },
    { key: 'partial', label: t.transactions.filterPartial },
    { key: 'paid', label: t.transactions.filterPaid }
  ];

  const buildParams = useCallback((status, filters) => {
    const p = {};
    if (status) p.status = status;
    if (filters.dateFrom) p.dateFrom = filters.dateFrom;
    if (filters.dateTo) p.dateTo = filters.dateTo;
    if (filters.currencyFrom) p.currencyFrom = filters.currencyFrom;
    if (filters.currencyTo) p.currencyTo = filters.currencyTo;
    if (filters.amountMin) p.amountMin = filters.amountMin;
    if (filters.amountMax) p.amountMax = filters.amountMax;
    return p;
  }, []);

  // Re-apply filter from params every time the screen gets focus
  // (handles navigation from dashboard when tab is already mounted)
  useFocusEffect(useCallback(() => {
    const newStatus = params.status || '';
    const newDateFrom = params.dateFrom || '';
    const newDateTo = params.dateTo || '';
    setActiveFilter(newStatus);
    const newAdv = { dateFrom: newDateFrom, dateTo: newDateTo, currencyFrom: '', currencyTo: '', amountMin: '', amountMax: '' };
    if (newDateFrom || newDateTo) setAdv(a => ({ ...a, dateFrom: newDateFrom, dateTo: newDateTo }));
    fetchTransactions(buildParams(newStatus || undefined, newAdv));
  }, [params.status, params.dateFrom, params.dateTo, fetchTransactions, buildParams]));

  const advCount = Object.values(adv).filter(v => v !== '').length;

  useEffect(() => {
    fetchTransactions(buildParams(activeFilter || undefined, adv));
  }, [activeFilter]);

  const onRefresh = useCallback(() => {
    fetchTransactions(buildParams(activeFilter || undefined, adv));
  }, [activeFilter, adv]);

  const applyAdvanced = () => {
    setShowAdvanced(false);
    fetchTransactions(buildParams(activeFilter || undefined, adv));
  };

  const resetAdvanced = () => {
    const empty = { dateFrom: '', dateTo: '', currencyFrom: '', currencyTo: '', amountMin: '', amountMax: '' };
    setAdv(empty);
    fetchTransactions(buildParams(activeFilter || undefined, empty));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.transactions.title}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/transactions/new')}>
          <Ionicons name="add" size={22} color={COLORS.white} />
          <Text style={styles.addBtnText}>{t.transactions.new}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, activeFilter === f.key && styles.filterBtnActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterBtn, advCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowAdvanced(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="options-outline" size={14} color={advCount > 0 ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.filterText, advCount > 0 && styles.filterTextActive]}>Filtres</Text>
            {advCount > 0 && (
              <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{advCount}</Text></View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Advanced Filters Modal */}
      <Modal visible={showAdvanced} transparent animationType="slide" onRequestClose={() => setShowAdvanced(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtres avancés</Text>
              <TouchableOpacity onPress={() => setShowAdvanced(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Date range */}
              <Text style={styles.advLabel}>Période</Text>
              <View style={styles.advRow}>
                <View style={styles.advHalf}>
                  <Text style={styles.advSubLabel}>Du (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.advInput}
                    value={adv.dateFrom}
                    onChangeText={v => setAdv(a => ({ ...a, dateFrom: v }))}
                    placeholder="2025-01-01"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
                <View style={styles.advHalf}>
                  <Text style={styles.advSubLabel}>Au (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.advInput}
                    value={adv.dateTo}
                    onChangeText={v => setAdv(a => ({ ...a, dateTo: v }))}
                    placeholder="2025-12-31"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>

              {/* Currency */}
              <Text style={styles.advLabel}>Devise source</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['', ...COMMON_CURRENCIES].map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chipBtn, adv.currencyFrom === c && styles.chipBtnActive]}
                      onPress={() => setAdv(a => ({ ...a, currencyFrom: c }))}
                    >
                      <Text style={[styles.chipText, adv.currencyFrom === c && styles.chipTextActive]}>{c || 'Toutes'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.advLabel}>Devise cible</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['', ...COMMON_CURRENCIES].map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chipBtn, adv.currencyTo === c && styles.chipBtnActive]}
                      onPress={() => setAdv(a => ({ ...a, currencyTo: c }))}
                    >
                      <Text style={[styles.chipText, adv.currencyTo === c && styles.chipTextActive]}>{c || 'Toutes'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Amount range */}
              <Text style={styles.advLabel}>Montant (devise cible)</Text>
              <View style={styles.advRow}>
                <View style={styles.advHalf}>
                  <Text style={styles.advSubLabel}>Min</Text>
                  <TextInput
                    style={styles.advInput}
                    value={adv.amountMin}
                    onChangeText={v => setAdv(a => ({ ...a, amountMin: v }))}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
                <View style={styles.advHalf}>
                  <Text style={styles.advSubLabel}>Max</Text>
                  <TextInput
                    style={styles.advInput}
                    value={adv.amountMax}
                    onChangeText={v => setAdv(a => ({ ...a, amountMax: v }))}
                    keyboardType="decimal-pad"
                    placeholder="999999"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetAdvanced}>
                <Text style={styles.resetBtnText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyAdvanced}>
                <Text style={styles.applyBtnText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionCard tx={item} onPress={() => router.push(`/transactions/${item.id}`)} remainingLabel={t.transactions.remaining} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.empty}>
              <Ionicons name="swap-horizontal-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>{t.transactions.noResults}</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/transactions/new')}>
                <Text style={styles.emptyBtnText}>{t.transactions.new}</Text>
              </TouchableOpacity>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingTop: 56, paddingBottom: SPACING.lg
  },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.white },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 8
  },
  addBtnText: { color: COLORS.white, fontWeight: '600', fontSize: FONTS.sizes.sm },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.sm
  },
  filterBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: RADIUS.full, backgroundColor: COLORS.background
  },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  filterTextActive: { color: COLORS.white },
  list: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  ref: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.primary },
  date: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  clientName: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, flex: 1 },
  exchangeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fromAmount: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  toAmount: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.primary },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.divider
  },
  remainingLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  remainingAmount: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.danger },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary, fontWeight: '600' },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
  emptyBtnText: { color: COLORS.white, fontWeight: '700' },
  filterBadge: {
    backgroundColor: COLORS.white, borderRadius: 8, width: 16, height: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING.xl, paddingBottom: 40, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  advLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: SPACING.sm },
  advSubLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginBottom: 4 },
  advRow: { flexDirection: 'row', gap: 12, marginBottom: SPACING.sm },
  advHalf: { flex: 1 },
  advInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm, height: 44, fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary, backgroundColor: COLORS.background,
  },
  chipBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background,
  },
  chipBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: SPACING.lg },
  resetBtn: {
    flex: 1, height: 50, borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
  },
  resetBtnText: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textSecondary },
  applyBtn: {
    flex: 2, height: 50, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  applyBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
});
