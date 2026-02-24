import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, Share, Clipboard
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useClientStore from '../../src/store/clientStore';
import useDepositOrderStore from '../../src/store/depositOrderStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useLanguageStore from '../../src/store/languageStore';
import { formatCurrency, formatDate, getStatusConfig, getInitials } from '../../src/utils/helpers';

function InfoRow({ label, value, icon }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={16} color={COLORS.textSecondary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function TxItem({ tx, onPress }) {
  const status = getStatusConfig(tx.status);
  return (
    <TouchableOpacity style={styles.txItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.txDot, { backgroundColor: status.color }]} />
      <View style={styles.txInfo}>
        <Text style={styles.txRef}>{tx.reference}</Text>
        <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={styles.txAmount}>{formatCurrency(tx.amountTo, tx.currencyTo)}</Text>
        <View style={[styles.txBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.txBadgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguageStore();
  const { currentClient, isLoading, fetchClientById, deleteClient, getClientTransactions } = useClientStore();
  const { getClientOrders, addPayment } = useDepositOrderStore();
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [depositOrders, setDepositOrders] = useState([]);
  const [depositLoading, setDepositLoading] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClientById(id);
    loadTransactions();
  }, [id]);

  useEffect(() => {
    if (currentClient?.name) loadDepositOrders();
  }, [currentClient?.name]);

  const loadTransactions = async () => {
    setTxLoading(true);
    const result = await getClientTransactions(id, { limit: 20 });
    if (result?.success) setTransactions(result.data);
    setTxLoading(false);
  };

  const loadDepositOrders = async () => {
    setDepositLoading(true);
    const result = await getClientOrders(currentClient.name);
    if (result?.success) setDepositOrders(result.data);
    setDepositLoading(false);
  };

  const handleAddPayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      Alert.alert('Erreur', 'Entrez un montant valide.');
      return;
    }
    setSaving(true);
    const result = await addPayment(selectedOrder.id, {
      amount: parseFloat(payAmount.replace(/\s/g, '')),
      notes: payNotes || null,
    });
    setSaving(false);
    if (result.success) {
      setShowAddPayment(false);
      setPayAmount('');
      setPayNotes('');
      Alert.alert('✅', 'Versement créé ! Envoyez le lien au client.');
      loadDepositOrders();
    } else {
      Alert.alert('Erreur', result.message);
    }
  };

  const handleDelete = () => {
    Alert.alert(t.clients.deactivate, `${t.clients.deactivate} ${currentClient?.name} ?`, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.clients.deactivate, style: 'destructive', onPress: async () => {
          const result = await deleteClient(id);
          if (result.success) router.back();
          else Alert.alert(t.common.error, result.message);
        }
      }
    ]);
  };

  if (isLoading && !currentClient) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const client = currentClient;
  if (!client) return null;

  const hasDebt = parseFloat(client.totalDebt) > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.clients.profile}</Text>
        <TouchableOpacity onPress={() => router.push(`/clients/edit/${id}`)} style={styles.editBtn}>
          <Ionicons name="pencil-outline" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Profile */}
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: hasDebt ? COLORS.dangerLight : COLORS.successLight }]}>
          <Text style={[styles.avatarText, { color: hasDebt ? COLORS.danger : COLORS.success }]}>
            {getInitials(client.name)}
          </Text>
        </View>
        <Text style={styles.clientName}>{client.name}</Text>
        {client.phone && <Text style={styles.clientPhone}>{client.phone}</Text>}
      </View>

      {/* Client Portal Card */}
      {client.clientCode && (
        <View style={styles.portalCard}>
          <View style={styles.portalCardTop}>
            <View>
              <Text style={styles.portalLabel}>{'Portail client'}</Text>
              <Text style={styles.portalCode}>{client.clientCode}</Text>
              <Text style={styles.portalUrl}>{'exchange.kabrakeng.com/client/' + client.clientCode}</Text>
            </View>
            <View style={styles.portalActions}>
              <TouchableOpacity
                style={styles.portalShareBtn}
                onPress={() => Share.share({
                  message: `Bonjour ${client.name},\n\nVoici votre lien pour suivre vos commandes et envoyer vos reçus :\n\nhttps://exchange.kabrakeng.com/client/${client.clientCode}\n\nVous pouvez l'installer comme une app sur votre téléphone.\n\nKABRAK Exchange Pro`,
                  title: 'Lien portail client',
                })}
              >
                <Ionicons name="share-social-outline" size={20} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.portalShareBtn, { backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 8 }]}
                onPress={() => {
                  Clipboard.setString(`https://exchange.kabrakeng.com/client/${client.clientCode}`);
                  Alert.alert('', 'Lien copié !');
                }}
              >
                <Ionicons name="copy-outline" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Balance Cards */}
      <View style={styles.balanceRow}>
        <View style={[styles.balanceCard, { backgroundColor: COLORS.dangerLight }]}>
          <Text style={styles.balanceLabel}>{t.dashboard.owes}</Text>
          <Text style={[styles.balanceAmount, { color: COLORS.danger }]}>{formatCurrency(client.totalDebt)}</Text>
        </View>
        <View style={[styles.balanceCard, { backgroundColor: COLORS.successLight }]}>
          <Text style={styles.balanceLabel}>{t.clients.totalPaid}</Text>
          <Text style={[styles.balanceAmount, { color: COLORS.success }]}>{formatCurrency(client.totalPaid)}</Text>
        </View>
      </View>

      {/* Stats */}
      {client.stats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{client.stats.totalTransactions}</Text>
            <Text style={styles.statLbl}>{t.tabs.transactions}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: COLORS.danger }]}>{client.stats.unpaidCount}</Text>
            <Text style={styles.statLbl}>{t.common.unpaid}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: COLORS.warning }]}>{client.stats.partialCount}</Text>
            <Text style={styles.statLbl}>{t.common.partial}</Text>
          </View>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>{t.transactions.information}</Text>
        <InfoRow label={t.clients.email} value={client.email} icon="mail-outline" />
        <InfoRow label={t.clients.phone} value={client.phone} icon="call-outline" />
        <InfoRow label={t.clients.address} value={client.address} icon="location-outline" />
        <InfoRow label={t.clients.idNumber} value={client.idNumber} icon="card-outline" />
        <InfoRow label={t.clients.notes} value={client.notes} icon="document-text-outline" />
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
          onPress={() => router.push(`/transactions/new?clientId=${id}`)}
        >
          <Ionicons name="add-circle-outline" size={18} color={COLORS.white} />
          <Text style={styles.actionBtnText}>{t.transactions.new}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.info }]}
          onPress={() => router.push(`/deposits?clientId=${id}`)}
        >
          <Ionicons name="wallet-outline" size={18} color={COLORS.white} />
          <Text style={styles.actionBtnText}>{t.deposits?.title || 'Dépôt'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
          onPress={() => router.push(`/reports/client/${id}`)}
        >
          <Ionicons name="time-outline" size={18} color={COLORS.white} />
          <Text style={styles.actionBtnText}>{t.more?.history || 'Historique'}</Text>
        </TouchableOpacity>
      </View>

      {/* Deposit Orders */}
      <View style={styles.txSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
          <Text style={styles.sectionTitle}>Commandes de dépôt</Text>
          <TouchableOpacity
            onPress={() => router.push(`/deposits?clientId=${id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md }}
          >
            <Ionicons name="add" size={14} color={COLORS.white} />
            <Text style={{ color: COLORS.white, fontSize: FONTS.sizes.xs, fontWeight: '700' }}>Nouvelle</Text>
          </TouchableOpacity>
        </View>

        {depositLoading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : depositOrders.length === 0 ? (
          <Text style={styles.emptyTx}>Aucune commande de dépôt</Text>
        ) : (
          depositOrders.map((order) => {
            const remaining = parseFloat(order.remainingAmount || 0);
            const total = parseFloat(order.totalAmount || 0);
            const pct = total > 0 ? Math.min(1, (total - remaining) / total) : 0;
            const isActive = order.status !== 'completed' && order.status !== 'cancelled';
            const statusColor = order.status === 'completed' ? COLORS.primary : order.status === 'partial' ? '#d97706' : order.status === 'cancelled' ? '#dc2626' : '#0369a1';
            const statusBg = order.status === 'completed' ? '#e6f4ef' : order.status === 'partial' ? '#fef3c7' : order.status === 'cancelled' ? '#fee2e2' : '#e0f2fe';
            const statusLabel = order.status === 'completed' ? 'Complété' : order.status === 'partial' ? 'Partiel' : order.status === 'cancelled' ? 'Annulé' : 'En attente';
            return (
              <View key={order.id} style={[styles.depositCard, { borderLeftColor: statusColor }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary }}>{order.reference}</Text>
                    <Text style={{ fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 }}>{order.currency} • {order.bank || 'Banque non précisée'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={{ fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary }}>{formatCurrency(total, order.currency)}</Text>
                    <View style={{ backgroundColor: statusBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor }}>{statusLabel}</Text>
                    </View>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={{ height: 5, backgroundColor: COLORS.border, borderRadius: 3, marginVertical: 8 }}>
                  <View style={{ width: `${Math.round(pct * 100)}%`, height: 5, borderRadius: 3, backgroundColor: statusColor }} />
                </View>

                {/* Remaining */}
                {remaining > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: FONTS.sizes.xs, color: '#dc2626', fontWeight: '600' }}>
                      Restant dû : {formatCurrency(remaining, order.currency)}
                    </Text>
                    {isActive && (
                      <TouchableOpacity
                        onPress={() => { setSelectedOrder(order); setPayAmount(String(remaining)); setShowAddPayment(true); }}
                        style={{ backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        <Ionicons name="add-circle-outline" size={13} color={COLORS.white} />
                        <Text style={{ color: COLORS.white, fontSize: 11, fontWeight: '700' }}>Versement</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Payments count */}
                {(order.payments?.length > 0) && (
                  <Text style={{ fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 4 }}>
                    {order.payments.length} versement{order.payments.length > 1 ? 's' : ''} • {formatDate(order.createdAt)}
                  </Text>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Add Payment Modal */}
      <Modal visible={showAddPayment} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
              <Text style={{ fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary }}>Nouveau versement</Text>
              <TouchableOpacity onPress={() => setShowAddPayment(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <View style={{ backgroundColor: '#e0f2fe', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md }}>
                <Text style={{ fontSize: FONTS.sizes.sm, color: '#0369a1', fontWeight: '600' }}>
                  Commande {selectedOrder.reference}
                </Text>
                <Text style={{ fontSize: FONTS.sizes.xs, color: '#0369a1' }}>
                  Total : {formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)} • Restant : {formatCurrency(selectedOrder.remainingAmount, selectedOrder.currency)}
                </Text>
              </View>
            )}

            <Text style={{ fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase' }}>Montant du versement</Text>
            <TextInput
              style={{ backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.primary, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm, textAlign: 'center' }}
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="numeric"
              autoFocus
              placeholder="0"
            />
            <Text style={{ fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase' }}>Notes (optionnel)</Text>
            <TextInput
              style={{ backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md }}
              value={payNotes}
              onChangeText={setPayNotes}
              placeholder="Ex: Virement, espèces..."
            />
            <TouchableOpacity
              style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center' }}
              onPress={handleAddPayment}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md }}>Créer & Envoyer lien</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Transactions */}
      <View style={styles.txSection}>
        <Text style={styles.sectionTitle}>{t.transactions.paymentHistory}</Text>
        {txLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} />
        ) : transactions.length === 0 ? (
          <Text style={styles.emptyTx}>{t.transactions.noResults}</Text>
        ) : (
          transactions.map((tx) => (
            <TxItem key={tx.id} tx={tx} onPress={() => router.push(`/transactions/${tx.id}`)} />
          ))
        )}
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerZone}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          <Text style={styles.deleteBtnText}>{t.clients.deactivate}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
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
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  editBtn: { padding: 4 },
  profileSection: { alignItems: 'center', backgroundColor: COLORS.primary, paddingBottom: SPACING.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  avatarText: { fontSize: FONTS.sizes.xxl, fontWeight: '700' },
  clientName: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.white },
  clientPhone: { fontSize: FONTS.sizes.md, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  portalCard: {
    backgroundColor: '#0B6E4F', marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: RADIUS.lg, padding: SPACING.md,
  },
  portalCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  portalLabel: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.6)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  portalCode: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: '#e8a020', letterSpacing: 2 },
  portalUrl: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  portalActions: { alignItems: 'center' },
  portalShareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },

  balanceRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.sm },
  balanceCard: { flex: 1, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  balanceLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginBottom: 4 },
  balanceAmount: { fontSize: FONTS.sizes.lg, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.textPrimary },
  statLbl: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  infoCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: RADIUS.md, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2
  },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, maxWidth: '55%', textAlign: 'right' },
  actionsRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginTop: SPACING.md, gap: SPACING.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: RADIUS.md, paddingVertical: 12 },
  actionBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.sm },
  depositCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  txSection: { marginHorizontal: SPACING.lg, marginTop: SPACING.md },
  txItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2
  },
  txDot: { width: 10, height: 10, borderRadius: 5, marginRight: SPACING.sm },
  txInfo: { flex: 1 },
  txRef: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.primary },
  txDate: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary },
  txBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full, marginTop: 2 },
  txBadgeText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  emptyTx: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: SPACING.lg },
  dangerZone: { marginHorizontal: SPACING.lg, marginTop: SPACING.lg },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: COLORS.danger, borderRadius: RADIUS.md, paddingVertical: 12
  },
  deleteBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: FONTS.sizes.sm }
});
