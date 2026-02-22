import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import useCurrencyStore from '../../src/store/currencyStore';
import useAuthStore from '../../src/store/authStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useLanguageStore from '../../src/store/languageStore';
import { formatCurrency, formatDate } from '../../src/utils/helpers';

function OpenDayModal({ visible, currencies, onClose, onSuccess, t }) {
  const [currency, setCurrency] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    if (!currency) return Alert.alert(t.common.error, t.cashbook.selectCurrency);
    setLoading(true);
    try {
      await api.post('/cashbook/open', { currency, openingBalance: parseFloat(openingBalance) || 0 });
      Alert.alert(t.common.success, `${currency} ${t.cashbook.openDay}`);
      onSuccess();
      onClose();
    } catch (e) {
      Alert.alert(t.common.error, e.response?.data?.message || t.common.error);
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.cashbook.openDay}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
          </View>
          <Text style={styles.modalLabel}>{t.cashbook.selectCurrency}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
            {currencies.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[styles.currencyChip, currency === c.code && styles.currencyChipActive]}
                onPress={() => setCurrency(c.code)}
              >
                <Text style={[styles.currencyChipText, currency === c.code && styles.currencyChipTextActive]}>{c.code}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.modalLabel}>{t.cashbook.openingBalance}</Text>
          <TextInput
            style={styles.modalInput}
            value={openingBalance}
            onChangeText={setOpeningBalance}
            placeholder="0.00"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.modalBtn} onPress={handleOpen} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalBtnText}>{t.cashbook.openDay}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CloseDayModal({ visible, entry, onClose, onSuccess, t }) {
  const [physicalCount, setPhysicalCount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = async () => {
    setLoading(true);
    try {
      await api.put(`/cashbook/${entry.id}/close`, {
        physicalCount: physicalCount ? parseFloat(physicalCount) : null,
        notes
      });
      Alert.alert(t.common.success, t.cashbook.closeDay);
      onSuccess();
      onClose();
    } catch (e) {
      Alert.alert(t.common.error, e.response?.data?.message || t.common.error);
    }
    setLoading(false);
  };

  if (!entry) return null;
  const closing = parseFloat(entry.openingBalance) + parseFloat(entry.totalIn) - parseFloat(entry.totalOut);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.cashbook.closeDay}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
          </View>
          <View style={styles.closingSummary}>
            <Text style={styles.closingLabel}>{t.cashbook.closingBalance}</Text>
            <Text style={styles.closingAmount}>{formatCurrency(closing, entry.currency)}</Text>
          </View>
          <Text style={styles.modalLabel}>{t.cashbook.openingBalance} ({t.common.optional})</Text>
          <TextInput
            style={styles.modalInput}
            value={physicalCount}
            onChangeText={setPhysicalCount}
            placeholder="0.00"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="decimal-pad"
          />
          <Text style={styles.modalLabel}>{t.common.notes}</Text>
          <TextInput
            style={styles.modalInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="..."
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.secondary }]} onPress={handleClose} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalBtnText}>{t.cashbook.closeDay}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CashbookEntry({ entry, onClose, t }) {
  const diff = parseFloat(entry.difference || 0);
  return (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryCodeBox}>
          <Text style={styles.entryCode}>{entry.currency}</Text>
        </View>
        <View style={styles.entryInfo}>
          <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
          <View style={[styles.entryStatus, { backgroundColor: entry.isClosed ? COLORS.successLight : COLORS.warningLight }]}>
            <Text style={[styles.entryStatusText, { color: entry.isClosed ? COLORS.success : COLORS.warning }]}>
              {entry.isClosed ? t.cashbook.closeDay : t.cashbook.openDay}
            </Text>
          </View>
        </View>
        {!entry.isClosed && (
          <TouchableOpacity style={styles.closeBtn} onPress={() => onClose(entry)}>
            <Text style={styles.closeBtnText}>{t.cashbook.closeDay}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.entryAmounts}>
        <View style={styles.entryAmountItem}>
          <Text style={styles.entryAmountLabel}>{t.cashbook.openingBalance}</Text>
          <Text style={styles.entryAmountValue}>{formatCurrency(entry.openingBalance)}</Text>
        </View>
        <View style={styles.entryAmountItem}>
          <Text style={[styles.entryAmountLabel, { color: COLORS.success }]}>{t.cashbook.income}</Text>
          <Text style={[styles.entryAmountValue, { color: COLORS.success }]}>+{formatCurrency(entry.totalIn)}</Text>
        </View>
        <View style={styles.entryAmountItem}>
          <Text style={[styles.entryAmountLabel, { color: COLORS.danger }]}>{t.cashbook.expenses}</Text>
          <Text style={[styles.entryAmountValue, { color: COLORS.danger }]}>-{formatCurrency(entry.totalOut)}</Text>
        </View>
        <View style={styles.entryAmountItem}>
          <Text style={styles.entryAmountLabel}>{t.cashbook.closingBalance}</Text>
          <Text style={[styles.entryAmountValue, { fontWeight: '700' }]}>{formatCurrency(entry.closingBalance)}</Text>
        </View>
      </View>
      {entry.isClosed && entry.physicalCount !== null && (
        <View style={[styles.diffRow, { backgroundColor: diff === 0 ? COLORS.successLight : Math.abs(diff) < 100 ? COLORS.warningLight : COLORS.dangerLight }]}>
          <Text style={styles.diffLabel}>{t.cashbook.difference}:</Text>
          <Text style={[styles.diffValue, { color: diff === 0 ? COLORS.success : diff > 0 ? COLORS.success : COLORS.danger }]}>
            {diff >= 0 ? '+' : ''}{formatCurrency(diff, entry.currency)}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function CashbookScreen() {
  const router = useRouter();
  const { t, language } = useLanguageStore();
  const { user } = useAuthStore();
  const { currencies, fetchCurrencies } = useCurrencyStore();

  useEffect(() => {
    if (user && user.role !== 'admin') { router.back(); }
  }, [user]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    fetchCurrencies();
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cashbook/today');
      setEntries(res.data.data);
    } catch (e) { }
    setLoading(false);
  };

  const handleCloseEntry = (entry) => {
    setSelectedEntry(entry);
    setShowCloseModal(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{t.cashbook.title}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowOpenModal(true)}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEntries} colors={[COLORS.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.todayLabel}>{t.cashbook.today} — {new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

        {loading && entries.length === 0 ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : entries.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={60} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>{t.cashbook.noEntries}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowOpenModal(true)}>
              <Text style={styles.emptyBtnText}>{t.cashbook.openDay}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          entries.map((entry) => (
            <CashbookEntry key={entry.id} entry={entry} onClose={handleCloseEntry} t={t} />
          ))
        )}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      <OpenDayModal
        visible={showOpenModal}
        currencies={currencies}
        onClose={() => setShowOpenModal(false)}
        onSuccess={loadEntries}
        t={t}
      />
      <CloseDayModal
        visible={showCloseModal}
        entry={selectedEntry}
        onClose={() => setShowCloseModal(false)}
        onSuccess={loadEntries}
        t={t}
      />
    </View>
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
  title: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center'
  },
  scroll: { padding: SPACING.lg },
  todayLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.md },
  entryCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  entryCodeBox: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm
  },
  entryCode: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.sm },
  entryInfo: { flex: 1 },
  entryDate: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  entryStatus: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, marginTop: 4 },
  entryStatusText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  closeBtn: {
    backgroundColor: COLORS.secondary, paddingHorizontal: SPACING.md,
    paddingVertical: 6, borderRadius: RADIUS.md
  },
  closeBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.xs },
  entryAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
  entryAmountItem: { alignItems: 'center' },
  entryAmountLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 2 },
  entryAmountValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  diffRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.sm
  },
  diffLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  diffValue: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary, fontWeight: '600' },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
  emptyBtnText: { color: COLORS.white, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.overlay },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg, paddingBottom: SPACING.xl
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  modalLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6, marginTop: SPACING.sm },
  modalInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 48, fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary, backgroundColor: COLORS.background
  },
  modalBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 50, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.md
  },
  modalBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md },
  currencyChip: {
    paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.border, marginRight: SPACING.sm
  },
  currencyChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  currencyChipText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary },
  currencyChipTextActive: { color: COLORS.white },
  closingSummary: {
    backgroundColor: COLORS.infoLight, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.sm
  },
  closingLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  closingAmount: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.primary }
});
