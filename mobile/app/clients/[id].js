import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, Share, Clipboard, Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useClientStore from '../../src/store/clientStore';
import useDepositOrderStore from '../../src/store/depositOrderStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useLanguageStore from '../../src/store/languageStore';
import { formatCurrency, formatDate, getStatusConfig, getInitials } from '../../src/utils/helpers';

const DEP_STATUS = {
  pending:          { label: 'En attente',  color: '#0369a1', bg: '#e0f2fe' },
  receipt_uploaded: { label: 'Reçu reçu',   color: '#7c3aed', bg: '#ede9fe' },
  confirmed:        { label: 'Confirmé',    color: '#15803d', bg: '#dcfce7' },
  rejected:         { label: 'Rejeté',      color: '#dc2626', bg: '#fee2e2' },
};
const ORD_STATUS = {
  pending:   { label: 'En attente', color: '#0369a1', bg: '#e0f2fe' },
  partial:   { label: 'Partiel',    color: '#d97706', bg: '#fef3c7' },
  completed: { label: 'Complété',   color: '#15803d', bg: '#dcfce7' },
  cancelled: { label: 'Annulé',     color: '#dc2626', bg: '#fee2e2' },
};

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onAction && (
        <TouchableOpacity onPress={onAction} style={styles.sectionBtn}>
          <Ionicons name="add" size={14} color={COLORS.white} />
          <Text style={styles.sectionBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function InfoRow({ label, value, icon }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={15} color={COLORS.textSecondary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function TxItem({ tx, onPress }) {
  const status = getStatusConfig(tx.status);
  const paid = parseFloat(tx.amountPaid || 0);
  const total = parseFloat(tx.amountTo || 0);
  const remaining = parseFloat(tx.amountRemaining || 0);
  return (
    <TouchableOpacity style={styles.txItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.txDot, { backgroundColor: status.color }]} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.txRef}>{tx.reference}</Text>
          <Text style={styles.txAmount}>{formatCurrency(total, tx.currencyTo)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <Text style={styles.txDate}>{tx.currencyFrom} → {tx.currencyTo} • {formatDate(tx.createdAt)}</Text>
          <View style={[styles.txBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.txBadgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        {tx.status !== 'paid' && remaining > 0 && (
          <Text style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>
            Payé: {formatCurrency(paid, tx.currencyTo)} • Restant: {formatCurrency(remaining, tx.currencyTo)}
          </Text>
        )}
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

  const [receiptModal, setReceiptModal] = useState(null);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{client.name}</Text>
        <TouchableOpacity onPress={() => router.push(`/clients/edit/${id}`)} style={styles.editBtn}>
          <Ionicons name="pencil-outline" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Profile + balances */}
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: hasDebt ? 'rgba(220,38,38,0.2)' : 'rgba(21,128,61,0.2)' }]}>
          <Text style={[styles.avatarText, { color: hasDebt ? '#fca5a5' : '#86efac' }]}>{getInitials(client.name)}</Text>
        </View>
        {client.phone && <Text style={styles.clientPhone}>{client.phone}</Text>}
        <View style={styles.balanceRow}>
          <View style={[styles.balanceCard, { backgroundColor: 'rgba(220,38,38,0.15)' }]}>
            <Text style={styles.balanceLabel}>Doit</Text>
            <Text style={[styles.balanceAmount, { color: '#fca5a5' }]}>{formatCurrency(client.totalDebt)}</Text>
          </View>
          <View style={[styles.balanceCard, { backgroundColor: 'rgba(21,128,61,0.15)' }]}>
            <Text style={styles.balanceLabel}>Payé</Text>
            <Text style={[styles.balanceAmount, { color: '#86efac' }]}>{formatCurrency(client.totalPaid)}</Text>
          </View>
          {client.stats && (
            <View style={[styles.balanceCard, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={styles.balanceLabel}>Échanges</Text>
              <Text style={[styles.balanceAmount, { color: COLORS.white }]}>{client.stats.totalTransactions}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} onPress={() => router.push(`/transactions/new?clientId=${id}`)}>
          <Ionicons name="swap-horizontal-outline" size={17} color={COLORS.white} />
          <Text style={styles.actionBtnText}>Échange</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0369a1' }]} onPress={() => router.push(`/deposits?clientId=${id}`)}>
          <Ionicons name="wallet-outline" size={17} color={COLORS.white} />
          <Text style={styles.actionBtnText}>Dépôt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#7c3aed' }]} onPress={() => router.push(`/reports/client/${id}`)}>
          <Ionicons name="document-text-outline" size={17} color={COLORS.white} />
          <Text style={styles.actionBtnText}>Rapport</Text>
        </TouchableOpacity>
      </View>

      {/* Portail client */}
      {client.clientCode && (
        <View style={styles.portalCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.portalLabel}>PORTAIL CLIENT</Text>
            <Text style={styles.portalCode}>{client.clientCode}</Text>
            <Text style={styles.portalUrl}>exchange.kabrakeng.com/client/{client.clientCode}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => Share.share({ message: `Bonjour ${client.name},\n\nSuivez vos commandes :\nhttps://exchange.kabrakeng.com/client/${client.clientCode}\n\nKABRAK Exchange Pro` })}>
              <Ionicons name="share-social-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]} onPress={() => { Clipboard.setString(`https://exchange.kabrakeng.com/client/${client.clientCode}`); Alert.alert('', 'Lien copié !'); }}>
              <Ionicons name="copy-outline" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── DÉPÔTS ── */}
      <View style={styles.section}>
        <SectionHeader title="💰 Commandes de dépôt" actionLabel="Nouvelle" onAction={() => router.push(`/deposits?clientId=${id}`)} />
        {depositLoading ? <ActivityIndicator color={COLORS.primary} /> :
         depositOrders.length === 0 ? <Text style={styles.empty}>Aucune commande de dépôt</Text> :
         depositOrders.map((order) => {
           const ordSt = ORD_STATUS[order.status] || ORD_STATUS.pending;
           const total = parseFloat(order.totalAmount || 0);
           const remaining = parseFloat(order.remainingAmount || 0);
           const received = total - remaining;
           const pct = total > 0 ? Math.min(1, received / total) : 0;
           const isActive = order.status !== 'completed' && order.status !== 'cancelled';
           return (
             <View key={order.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: ordSt.color, marginBottom: SPACING.sm }]}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <View style={{ flex: 1 }}>
                   <Text style={{ fontSize: FONTS.sizes.sm, fontWeight: '800', color: COLORS.textPrimary }}>{order.reference}</Text>
                   <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>{order.bank || 'Banque'} • {formatDate(order.createdAt)}</Text>
                 </View>
                 <View style={{ alignItems: 'flex-end', gap: 3 }}>
                   <Text style={{ fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary }}>{formatCurrency(total, order.currency)}</Text>
                   <View style={{ backgroundColor: ordSt.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
                     <Text style={{ fontSize: 10, fontWeight: '700', color: ordSt.color }}>{ordSt.label}</Text>
                   </View>
                 </View>
               </View>
               <View style={{ height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, marginVertical: 8 }}>
                 <View style={{ width: `${Math.round(pct * 100)}%`, height: 6, borderRadius: 3, backgroundColor: ordSt.color }} />
               </View>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                 <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>Reçu: {formatCurrency(received, order.currency)}</Text>
                 {remaining > 0 && <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: '700' }}>Restant: {formatCurrency(remaining, order.currency)}</Text>}
               </View>
               {order.payments?.length > 0 && (
                 <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 }}>
                   <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6 }}>
                     {order.payments.length} VERSEMENT{order.payments.length > 1 ? 'S' : ''}
                   </Text>
                   {order.payments.map((dep) => {
                     const depSt = DEP_STATUS[dep.status] || DEP_STATUS.pending;
                     return (
                       <View key={dep.id} style={styles.depRow}>
                         <View style={{ flex: 1 }}>
                           <Text style={{ fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary }}>{formatCurrency(dep.amount, order.currency)}</Text>
                           <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>{dep.code} • {formatDate(dep.createdAt)}</Text>
                         </View>
                         <View style={{ alignItems: 'flex-end', gap: 4 }}>
                           <View style={{ backgroundColor: depSt.bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 }}>
                             <Text style={{ fontSize: 10, fontWeight: '700', color: depSt.color }}>{depSt.label}</Text>
                           </View>
                           {dep.receiptImageUrl ? (
                             <TouchableOpacity onPress={() => setReceiptModal(dep.receiptImageUrl)} style={styles.receiptBtn}>
                               <Ionicons name="image-outline" size={13} color="#7c3aed" />
                               <Text style={{ fontSize: 10, color: '#7c3aed', fontWeight: '700' }}>Voir reçu</Text>
                             </TouchableOpacity>
                           ) : null}
                         </View>
                       </View>
                     );
                   })}
                 </View>
               )}
               {isActive && (
                 <TouchableOpacity
                   onPress={() => { setSelectedOrder(order); setPayAmount(remaining > 0 ? String(Math.round(remaining)) : ''); setShowAddPayment(true); }}
                   style={styles.addVersBtn}
                 >
                   <Ionicons name="add-circle-outline" size={14} color={COLORS.white} />
                   <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '700' }}>Ajouter un versement</Text>
                 </TouchableOpacity>
               )}
             </View>
           );
         })
        }
      </View>

      {/* ── ÉCHANGES ── */}
      <View style={styles.section}>
        <SectionHeader title="🔄 Échanges de devises" actionLabel="Nouveau" onAction={() => router.push(`/transactions/new?clientId=${id}`)} />
        {txLoading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.md }} /> :
         transactions.length === 0 ? <Text style={styles.empty}>Aucun échange</Text> :
         transactions.map((tx) => <TxItem key={tx.id} tx={tx} onPress={() => router.push(`/transactions/${tx.id}`)} />)
        }
      </View>

      {/* Info */}
      <View style={[styles.card, { marginHorizontal: SPACING.lg, marginBottom: SPACING.sm }]}>
        <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Informations</Text>
        <InfoRow label="Email" value={client.email} icon="mail-outline" />
        <InfoRow label="Téléphone" value={client.phone} icon="call-outline" />
        <InfoRow label="Adresse" value={client.address} icon="location-outline" />
        <InfoRow label="Pièce d'identité" value={client.idNumber} icon="card-outline" />
        <InfoRow label="Notes" value={client.notes} icon="document-text-outline" />
      </View>

      {/* Danger */}
      <View style={{ marginHorizontal: SPACING.lg, marginTop: SPACING.sm, marginBottom: 40 }}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          <Text style={styles.deleteBtnText}>{t.clients.deactivate}</Text>
        </TouchableOpacity>
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
                <Text style={{ fontSize: FONTS.sizes.sm, color: '#0369a1', fontWeight: '600' }}>Commande {selectedOrder.reference}</Text>
                <Text style={{ fontSize: 11, color: '#0369a1' }}>Total : {formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)} • Restant : {formatCurrency(selectedOrder.remainingAmount, selectedOrder.currency)}</Text>
              </View>
            )}
            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase' }}>Montant</Text>
            <TextInput
              style={{ backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.primary, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm, textAlign: 'center' }}
              value={payAmount} onChangeText={setPayAmount} keyboardType="numeric" autoFocus placeholder="0"
            />
            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase' }}>Notes (optionnel)</Text>
            <TextInput
              style={{ backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md }}
              value={payNotes} onChangeText={setPayNotes} placeholder="Ex: Virement, espèces..."
            />
            <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center' }} onPress={handleAddPayment} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md }}>Créer & Envoyer lien</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Receipt viewer modal */}
      <Modal visible={!!receiptModal} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 56, right: 20, zIndex: 10 }} onPress={() => setReceiptModal(null)}>
            <Ionicons name="close-circle" size={36} color={COLORS.white} />
          </TouchableOpacity>
          {receiptModal && (
            <Image source={{ uri: receiptModal }} style={{ width: '90%', height: '70%', borderRadius: 12 }} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.lg },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white, flex: 1, textAlign: 'center' },
  editBtn: { padding: 4 },
  // Profile
  profileSection: { alignItems: 'center', backgroundColor: COLORS.primary, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  avatarText: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  clientPhone: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.6)', marginBottom: SPACING.md },
  balanceRow: { flexDirection: 'row', gap: SPACING.sm, width: '100%' },
  balanceCard: { flex: 1, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center' },
  balanceLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 },
  balanceAmount: { fontSize: FONTS.sizes.sm, fontWeight: '800' },
  // Actions
  actionsRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, marginTop: SPACING.md, gap: SPACING.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: RADIUS.md, paddingVertical: 11 },
  actionBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  // Portal card
  portalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B6E4F', marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.md },
  portalLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  portalCode: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: '#e8a020', letterSpacing: 2 },
  portalUrl: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  // Sections
  section: { marginHorizontal: SPACING.lg, marginTop: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  sectionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md },
  sectionBtnText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: COLORS.textMuted, paddingVertical: SPACING.lg, fontSize: FONTS.sizes.sm },
  // Cards
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  // Deposit rows
  depRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  receiptBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#ede9fe', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  addVersBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 10, marginTop: 10 },
  // Tx items
  txItem: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  txDot: { width: 10, height: 10, borderRadius: 5, marginRight: SPACING.sm, marginTop: 4 },
  txRef: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.primary },
  txAmount: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary },
  txDate: { fontSize: 11, color: COLORS.textSecondary },
  txBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99 },
  txBadgeText: { fontSize: 10, fontWeight: '700' },
  // Info rows
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, maxWidth: '55%', textAlign: 'right' },
  // Danger
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: COLORS.danger, borderRadius: RADIUS.md, paddingVertical: 12 },
  deleteBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: FONTS.sizes.sm },
});
