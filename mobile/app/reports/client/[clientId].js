import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Image, Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../src/services/api';
import { COLORS, SPACING, RADIUS, FONTS } from '../../../src/constants/colors';
import { formatCurrency, formatDate, getStatusConfig } from '../../../src/utils/helpers';
import useLanguageStore from '../../../src/store/languageStore';

const BACKEND_URL = 'http://localhost:5000';
const { width: SW, height: SH } = Dimensions.get('window');

const ORDER_STATUS = {
  pending:   { label: 'En attente', labelEn: 'Pending',   color: '#d97706', bg: '#fef3c7' },
  partial:   { label: 'Partiel',    labelEn: 'Partial',   color: '#0369a1', bg: '#e0f2fe' },
  completed: { label: 'Complété',   labelEn: 'Completed', color: '#0B6E4F', bg: '#e6f4ef' },
  cancelled: { label: 'Annulé',     labelEn: 'Cancelled', color: '#dc2626', bg: '#fee2e2' },
};

function fmt(n) { return parseFloat(n || 0).toLocaleString('fr-FR'); }

export default function ClientStatementScreen() {
  const { clientId } = useLocalSearchParams();
  const router = useRouter();
  const { language: lang } = useLanguageStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [receiptUrl, setReceiptUrl] = useState(null);

  useEffect(() => { load(); }, [clientId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/client/${clientId}/statement`);
      setData(res.data.data);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger l\'historique');
    }
    setLoading(false);
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!data) return null;

  const { client, transactions, depositOrders, summary } = data;

  const TABS = [
    { key: 'all',      label: lang === 'fr' ? 'Tout' : 'All' },
    { key: 'tx',       label: lang === 'fr' ? 'Transactions' : 'Transactions' },
    { key: 'deposits', label: lang === 'fr' ? 'Dépôts' : 'Deposits' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{lang === 'fr' ? 'Historique client' : 'Client history'}</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Client info bar */}
      <View style={styles.clientBar}>
        <View style={styles.clientAvatar}>
          <Text style={styles.clientAvatarText}>{(client.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.clientName}>{client.name}</Text>
          {client.phone ? <Text style={styles.clientPhone}>{client.phone}</Text> : null}
        </View>
      </View>

      {/* Summary strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryVal}>{summary.totalTransactions}</Text>
          <Text style={styles.summaryLbl}>{lang === 'fr' ? 'Transactions' : 'Transactions'}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: COLORS.danger }]}>{fmt(summary.totalRemaining)}</Text>
          <Text style={styles.summaryLbl}>{lang === 'fr' ? 'Restant dû' : 'Outstanding'}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryVal}>{summary.totalDepositOrders || 0}</Text>
          <Text style={styles.summaryLbl}>{lang === 'fr' ? 'Dépôts' : 'Deposits'}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: COLORS.primary }]}>{fmt(summary.totalDeposited)}</Text>
          <Text style={styles.summaryLbl}>{lang === 'fr' ? 'Versé' : 'Deposited'}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xl }}>

        {/* ── TRANSACTIONS ── */}
        {(tab === 'all' || tab === 'tx') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="swap-horizontal-outline" size={14} color={COLORS.textSecondary} />
              {' '}{lang === 'fr' ? 'Transactions de change' : 'Exchange transactions'} ({transactions.length})
            </Text>
            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>{lang === 'fr' ? 'Aucune transaction' : 'No transactions'}</Text>
            ) : transactions.map((tx) => {
              const status = getStatusConfig(tx.status);
              return (
                <TouchableOpacity key={tx.id} style={styles.row} onPress={() => router.push(`/transactions/${tx.id}`)} activeOpacity={0.7}>
                  <View style={[styles.rowDot, { backgroundColor: status.color }]} />
                  <View style={styles.rowBody}>
                    <Text style={styles.rowRef}>{tx.reference}</Text>
                    <Text style={styles.rowSub}>{formatDate(tx.createdAt)}</Text>
                    <Text style={styles.rowSub}>{formatCurrency(tx.amountFrom, tx.currencyFrom)} → {formatCurrency(tx.amountTo, tx.currencyTo)}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <View style={[styles.badge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                    </View>
                    {parseFloat(tx.amountRemaining) > 0 && (
                      <Text style={styles.rowDanger}>-{formatCurrency(tx.amountRemaining, tx.currencyTo)}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── DEPOSIT ORDERS ── */}
        {(tab === 'all' || tab === 'deposits') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="wallet-outline" size={14} color={COLORS.textSecondary} />
              {' '}{lang === 'fr' ? 'Commandes de dépôt' : 'Deposit orders'} ({(depositOrders || []).length})
            </Text>
            {(depositOrders || []).length === 0 ? (
              <Text style={styles.emptyText}>{lang === 'fr' ? 'Aucun dépôt' : 'No deposits'}</Text>
            ) : (depositOrders || []).map((order) => {
              const cfg = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
              const pct = Math.min(1, parseFloat(order.receivedAmount || 0) / Math.max(1, parseFloat(order.totalAmount)));
              return (
                <View key={order.id} style={styles.orderCard}>
                  {/* Order header */}
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderRef}>{order.reference}</Text>
                    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.badgeText, { color: cfg.color }]}>{lang === 'fr' ? cfg.label : cfg.labelEn}</Text>
                    </View>
                  </View>
                  <Text style={styles.rowSub}>{formatDate(order.createdAt)}</Text>
                  {/* Progress bar */}
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: pct >= 1 ? COLORS.primary : '#0369a1' }]} />
                  </View>
                  <View style={styles.orderAmounts}>
                    <Text style={styles.rowSub}>{lang === 'fr' ? 'Reçu' : 'Received'}: <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{fmt(order.receivedAmount)}</Text></Text>
                    <Text style={styles.rowSub}>{lang === 'fr' ? 'Total' : 'Total'}: <Text style={{ fontWeight: '700' }}>{fmt(order.totalAmount)} {order.currency}</Text></Text>
                  </View>
                  {/* Payments inside order */}
                  {(order.payments || []).map((p) => {
                    const hasReceipt = !!p.receiptImageUrl;
                    const pColor = p.status === 'confirmed' ? COLORS.primary : p.status === 'rejected' ? COLORS.danger : '#d97706';
                    return (
                      <View key={p.id} style={styles.paymentRow}>
                        <View style={[styles.payDot, { backgroundColor: pColor + '22' }]}>
                          <Ionicons name={p.status === 'confirmed' ? 'checkmark' : p.status === 'rejected' ? 'close' : 'time-outline'} size={12} color={pColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.payCode}>{p.code}</Text>
                          <Text style={styles.rowSub}>{fmt(p.amount)} {order.currency}</Text>
                        </View>
                        {hasReceipt && (
                          <TouchableOpacity onPress={() => setReceiptUrl(`${BACKEND_URL}${p.receiptImageUrl}`)} style={styles.receiptBtn}>
                            <Ionicons name="image-outline" size={18} color={COLORS.info} />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Receipt full-screen viewer */}
      <Modal visible={!!receiptUrl} animationType="fade" transparent statusBarTranslucent>
        <View style={styles.receiptOverlay}>
          <TouchableOpacity style={styles.receiptClose} onPress={() => setReceiptUrl(null)}>
            <Ionicons name="close-circle" size={36} color={COLORS.white} />
          </TouchableOpacity>
          {receiptUrl && <Image source={{ uri: receiptUrl }} style={styles.receiptImage} resizeMode="contain" />}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingTop: 56, paddingBottom: SPACING.md
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  clientBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg
  },
  clientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  clientAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.xl },
  clientName: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  clientPhone: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  summaryStrip: { flexDirection: 'row', backgroundColor: COLORS.white, paddingVertical: SPACING.md, elevation: 2 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  summaryLbl: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: COLORS.divider },

  tabRow: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary },

  section: { marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: SPACING.lg, fontSize: FONTS.sizes.sm },

  row: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, elevation: 1 },
  rowDot: { width: 10, height: 10, borderRadius: 5, marginRight: SPACING.sm, marginTop: 4 },
  rowBody: { flex: 1 },
  rowRef: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.primary },
  rowSub: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowDanger: { fontSize: FONTS.sizes.xs, color: COLORS.danger, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  badgeText: { fontSize: 10, fontWeight: '700' },

  orderCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, elevation: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderRef: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.primary },
  orderAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressBg: { height: 5, backgroundColor: COLORS.border, borderRadius: 3, marginVertical: 6 },
  progressFill: { height: 5, borderRadius: 3 },

  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.divider, marginTop: 6 },
  payDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  payCode: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textPrimary },
  receiptBtn: { padding: 4 },

  receiptOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  receiptClose: { position: 'absolute', top: 52, right: 20, zIndex: 10 },
  receiptImage: { width: SW, height: SH * 0.8 },
});
