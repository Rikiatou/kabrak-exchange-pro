import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useTransactionStore from '../../src/store/transactionStore';
import usePaymentStore from '../../src/store/paymentStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useLanguageStore from '../../src/store/languageStore';
import { formatCurrency, formatDateTime, getStatusConfig } from '../../src/utils/helpers';
import { printReceipt, shareReceiptAsPDF } from '../../src/services/receiptService';
import useSettingStore from '../../src/store/settingStore';

function PaymentModal({ visible, transaction, onClose, onSuccess, t }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { createPayment } = usePaymentStore();

  const remaining = parseFloat(transaction?.amountRemaining || 0);

  const handlePay = async () => {
    const payAmount = parseFloat(amount);
    if (!amount || payAmount <= 0) return Alert.alert(t.common.error, t.transactions.invalidAmount);
    if (payAmount > remaining) return Alert.alert(t.common.error, `${t.transactions.maxAmount}: ${formatCurrency(remaining, transaction.currencyTo)}`);

    setLoading(true);
    const result = await createPayment({
      transactionId: transaction.id,
      amount: payAmount,
      currency: transaction.currencyTo,
      paymentMethod: method,
      notes
    });
    setLoading(false);

    if (result.success) {
      Alert.alert(t.transactions.paymentRecorded, result.message);
      setAmount('');
      setNotes('');
      onSuccess();
      onClose();
    } else {
      Alert.alert(t.common.error, result.message);
    }
  };

  const METHODS = [
    { key: 'cash', label: t.transactions.cash, icon: 'cash-outline' },
    { key: 'bank_transfer', label: t.transactions.bankTransfer, icon: 'business-outline' },
    { key: 'mobile_money', label: t.transactions.mobileMoney, icon: 'phone-portrait-outline' },
    { key: 'other', label: t.transactions.other, icon: 'ellipsis-horizontal-outline' }
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.transactions.recordPayment}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.remainingBox}>
            <Text style={styles.remainingLabel}>{t.transactions.balanceRemaining}</Text>
            <Text style={styles.remainingAmount}>{formatCurrency(remaining, transaction?.currencyTo)}</Text>
          </View>

          <Text style={styles.modalLabel}>{t.transactions.paymentAmount}</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={styles.maxBtn} onPress={() => setAmount(remaining.toString())}>
              <Text style={styles.maxBtnText}>MAX</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>{t.transactions.paymentMethod}</Text>
          <View style={styles.methodRow}>
            {METHODS.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.methodBtn, method === m.key && styles.methodBtnActive]}
                onPress={() => setMethod(m.key)}
              >
                <Ionicons name={m.icon} size={18} color={method === m.key ? COLORS.white : COLORS.textSecondary} />
                <Text style={[styles.methodText, method === m.key && styles.methodTextActive]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.modalLabel}>{t.transactions.notesOptional}</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Remarque..."
            placeholderTextColor={COLORS.textMuted}
          />

          <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.payBtnText}>{t.transactions.confirmPayment}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentTransaction, isLoading, fetchTransactionById } = useTransactionStore();
  const { t, language } = useLanguageStore();
  const { settings, fetchSettings } = useSettingStore();
  const [showPayModal, setShowPayModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  useEffect(() => { fetchTransactionById(id); fetchSettings(); }, [id]);

  const reload = () => fetchTransactionById(id);

  const handleShare = async () => {
    setPdfLoading(true);
    const result = await shareReceiptAsPDF(currentTransaction, settings.businessName || 'KABRAK Exchange Pro', language);
    setPdfLoading(false);
    if (!result.success) Alert.alert(t.common.error, result.message);
  };

  const handlePrint = async () => {
    setPrintLoading(true);
    const result = await printReceipt(currentTransaction, settings.businessName || 'KABRAK Exchange Pro', language);
    setPrintLoading(false);
    if (!result.success) Alert.alert(t.common.error, result.message);
  };

  if (isLoading && !currentTransaction) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const tx = currentTransaction;
  if (!tx) return null;

  const status = getStatusConfig(tx.status);
  const progressPct = tx.amountTo > 0 ? Math.min((parseFloat(tx.amountPaid) / parseFloat(tx.amountTo)) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerRef}>{tx.reference}</Text>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.statusText}>{status.label}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push(`/clients/${tx.clientId}`)} style={styles.clientBtn}>
            <Ionicons name="person-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Exchange Summary */}
        <View style={styles.exchangeCard}>
          <View style={styles.exchangeRow}>
            <View style={styles.exchangeSide}>
              <Text style={styles.exchangeLabel}>{t.transactions.donné}</Text>
              <Text style={styles.exchangeAmount}>{formatCurrency(tx.amountFrom, tx.currencyFrom)}</Text>
            </View>
            <View style={styles.exchangeArrow}>
              <Ionicons name="swap-horizontal" size={28} color={COLORS.primary} />
            </View>
            <View style={[styles.exchangeSide, { alignItems: 'flex-end' }]}>
              <Text style={styles.exchangeLabel}>{t.transactions.reçu}</Text>
              <Text style={[styles.exchangeAmount, { color: COLORS.primary }]}>{formatCurrency(tx.amountTo, tx.currencyTo)}</Text>
            </View>
          </View>
          <Text style={styles.rateText}>{t.transactions.rate}: 1 {tx.currencyFrom} = {parseFloat(tx.exchangeRate).toFixed(4)} {tx.currencyTo}</Text>
        </View>

        {/* Payment Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{t.transactions.paymentProgress}</Text>
            <Text style={styles.progressPct}>{progressPct.toFixed(0)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: progressPct >= 100 ? COLORS.success : COLORS.primary }]} />
          </View>
          <View style={styles.progressAmounts}>
            <View>
              <Text style={styles.paidLabel}>{t.common.paid}</Text>
              <Text style={[styles.paidAmount, { color: COLORS.success }]}>{formatCurrency(tx.amountPaid, tx.currencyTo)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.paidLabel}>{t.transactions.remaining}</Text>
              <Text style={[styles.paidAmount, { color: parseFloat(tx.amountRemaining) > 0 ? COLORS.danger : COLORS.success }]}>
                {formatCurrency(tx.amountRemaining, tx.currencyTo)}
              </Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>{t.transactions.information}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.transactions.client}</Text>
            <TouchableOpacity onPress={() => router.push(`/clients/${tx.clientId}`)}>
              <Text style={[styles.infoValue, { color: COLORS.primary }]}>{tx.client?.name}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.common.operator}</Text>
            <Text style={styles.infoValue}>{tx.operator?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.common.date}</Text>
            <Text style={styles.infoValue}>{formatDateTime(tx.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.common.type}</Text>
            <Text style={styles.infoValue}>{tx.type?.toUpperCase()}</Text>
          </View>
          {tx.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t.common.notes}</Text>
              <Text style={[styles.infoValue, { maxWidth: '60%', textAlign: 'right' }]}>{tx.notes}</Text>
            </View>
          )}
        </View>

        {/* Payments History */}
        {tx.payments?.length > 0 && (
          <View style={styles.paymentsCard}>
            <Text style={styles.sectionTitle}>{t.transactions.paymentHistory}</Text>
            {tx.payments.map((p) => (
              <View key={p.id} style={styles.paymentItem}>
                <View style={styles.paymentLeft}>
                  <View style={styles.paymentIcon}>
                    <Ionicons name="cash-outline" size={16} color={COLORS.success} />
                  </View>
                  <View>
                    <Text style={styles.paymentMethod}>{p.paymentMethod?.replace('_', ' ').toUpperCase()}</Text>
                    <Text style={styles.paymentDate}>{formatDateTime(p.createdAt)}</Text>
                  </View>
                </View>
                <Text style={styles.paymentAmount}>{formatCurrency(p.amount, p.currency)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Receipt Actions */}
        <View style={styles.receiptCard}>
          <Text style={styles.sectionTitle}>{t.transactions.receipt}</Text>
          <View style={styles.receiptBtns}>
            <TouchableOpacity style={[styles.receiptBtn, { backgroundColor: COLORS.infoLight }]} onPress={handleShare} disabled={pdfLoading}>
              {pdfLoading ? <ActivityIndicator size="small" color={COLORS.primary} /> : (
                <>
                  <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
                  <Text style={[styles.receiptBtnText, { color: COLORS.primary }]}>{t.transactions.whatsappEmail}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.receiptBtn, { backgroundColor: COLORS.successLight }]} onPress={handlePrint} disabled={printLoading}>
              {printLoading ? <ActivityIndicator size="small" color={COLORS.success} /> : (
                <>
                  <Ionicons name="print-outline" size={20} color={COLORS.success} />
                  <Text style={[styles.receiptBtnText, { color: COLORS.success }]}>{t.common.print}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Pay Button */}
      {tx.status !== 'paid' && (
        <View style={styles.payFooter}>
          <TouchableOpacity style={styles.payFooterBtn} onPress={() => setShowPayModal(true)}>
            <Ionicons name="cash" size={22} color={COLORS.white} />
            <Text style={styles.payFooterText}>{t.transactions.recordPayment}</Text>
          </TouchableOpacity>
        </View>
      )}

      <PaymentModal
        visible={showPayModal}
        transaction={tx}
        onClose={() => setShowPayModal(false)}
        onSuccess={reload}
        t={t}
      />
    </View>
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
  headerCenter: { alignItems: 'center' },
  headerRef: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full, marginTop: 4 },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.white },
  clientBtn: { padding: 4 },
  exchangeCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  exchangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exchangeSide: { flex: 1 },
  exchangeLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 4 },
  exchangeAmount: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.textPrimary },
  exchangeArrow: { paddingHorizontal: SPACING.md },
  rateText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm },
  progressCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.sm,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  progressTitle: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  progressPct: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.primary },
  progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: RADIUS.full },
  progressAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  paidLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  paidAmount: { fontSize: FONTS.sizes.md, fontWeight: '700' },
  infoCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.sm,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider
  },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  paymentsCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.sm,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  paymentItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider
  },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  paymentIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.successLight, justifyContent: 'center', alignItems: 'center'
  },
  paymentMethod: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  paymentDate: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  paymentAmount: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.success },
  receiptCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.sm,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  receiptBtns: { flexDirection: 'row', gap: SPACING.sm },
  receiptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: RADIUS.md, paddingVertical: 12
  },
  receiptBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  payFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, padding: SPACING.md, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 10
  },
  payFooterBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.secondary, borderRadius: RADIUS.md, height: 52, gap: 8
  },
  payFooterText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.overlay },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg, paddingBottom: SPACING.xl
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  remainingBox: {
    backgroundColor: COLORS.dangerLight, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.md
  },
  remainingLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  remainingAmount: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.danger },
  modalLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6, marginTop: SPACING.sm },
  amountRow: { flexDirection: 'row', gap: SPACING.sm },
  amountInput: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 50, fontSize: FONTS.sizes.xl,
    fontWeight: '700', color: COLORS.textPrimary, backgroundColor: COLORS.background
  },
  maxBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, justifyContent: 'center'
  },
  maxBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.sm },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  methodBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 8,
    borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border
  },
  methodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  methodText: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.textSecondary },
  methodTextActive: { color: COLORS.white },
  notesInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 44, fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary, backgroundColor: COLORS.background
  },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.secondary, borderRadius: RADIUS.md, height: 52, gap: 8, marginTop: SPACING.md
  },
  payBtnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' }
});
