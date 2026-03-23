import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput, ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useRemittanceStore from '../../src/store/remittanceStore';
import useLanguageStore from '../../src/store/languageStore';

const STATUS_CFG = {
  pending:   { label: 'En attente', labelEn: 'Pending',   color: '#d97706', bg: '#fef3c7', icon: 'time-outline' },
  partial:   { label: 'Partiel',    labelEn: 'Partial',   color: '#0369a1', bg: '#e0f2fe', icon: 'git-branch-outline' },
  completed: { label: 'Complété',   labelEn: 'Completed', color: '#0B6E4F', bg: '#e6f4ef', icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Annulé',     labelEn: 'Cancelled', color: '#dc2626', bg: '#fee2e2', icon: 'close-circle-outline' },
};

function fmt(n) { return parseFloat(n || 0).toLocaleString('fr-FR'); }

function Badge({ status, lang }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={11} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{lang === 'fr' ? cfg.label : cfg.labelEn}</Text>
    </View>
  );
}

function ProgressBar({ paid, total }) {
  const pct = Math.min(1, parseFloat(paid || 0) / Math.max(1, parseFloat(total)));
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: pct >= 1 ? COLORS.primary : '#d97706' }]} />
    </View>
  );
}

function RemittanceCard({ item, lang, onPress }) {
  const paid = parseFloat(item.paidAmount || 0);
  const total = parseFloat(item.totalAmount);
  const remaining = parseFloat(item.remainingAmount || total);
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.75}>
      <View style={[styles.cardLeft, { backgroundColor: STATUS_CFG[item.status]?.bg || '#fef3c7' }]}>
        <Ionicons name="arrow-up-circle-outline" size={22} color={STATUS_CFG[item.status]?.color || '#d97706'} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardName} numberOfLines={1}>{item.beneficiaryName}</Text>
          <Text style={styles.cardRef}>{item.reference}</Text>
        </View>
        {item.beneficiaryBank ? <Text style={styles.cardBank}>{item.beneficiaryBank}</Text> : null}
        <ProgressBar paid={paid} total={total} />
        <View style={styles.cardRow}>
          <Text style={styles.cardAmount}>{fmt(paid)} / {fmt(total)} {item.currency}</Text>
          <Badge status={item.status} lang={lang} />
        </View>
        {remaining > 0
          ? <Text style={styles.cardRemaining}>{lang === 'fr' ? 'Reste à reverser' : 'Remaining'} : <Text style={{ color: COLORS.warning, fontWeight: '700' }}>{fmt(remaining)} {item.currency}</Text></Text>
          : <Text style={[styles.cardRemaining, { color: COLORS.primary }]}>✅ {lang === 'fr' ? 'Reversement complet' : 'Fully paid'}</Text>
        }
      </View>
    </TouchableOpacity>
  );
}

const EMPTY_FORM = { beneficiaryName: '', beneficiaryBank: '', beneficiaryAccount: '', beneficiaryPhone: '', totalAmount: '', currency: 'FCFA', notes: '' };
const EMPTY_PAY = { amount: '', reference: '', notes: '' };

export default function RemittancesScreen() {
  const router = useRouter();
  const { language: lang } = useLanguageStore();
  const { remittances, stats, loading, fetchRemittances, fetchStats, create, addPayment, getOne, remove } = useRemittanceStore();

  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddPay, setShowAddPay] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [payForm, setPayForm] = useState(EMPTY_PAY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    const p = {};
    if (filterStatus) p.status = filterStatus;
    fetchRemittances(p);
    fetchStats();
  }, [filterStatus]);

  useFocusEffect(useCallback(() => { load(); }, [filterStatus]));

  const handleCreate = async () => {
    if (!form.beneficiaryName.trim() || !form.totalAmount) {
      Alert.alert(lang === 'fr' ? 'Erreur' : 'Error', lang === 'fr' ? 'Bénéficiaire et montant requis' : 'Beneficiary and amount required');
      return;
    }
    setSaving(true);
    const result = await create({
      ...form,
      totalAmount: parseFloat(String(form.totalAmount).replace(/\s/g, '')),
    });
    setSaving(false);
    if (result.success) {
      setShowNew(false);
      setForm(EMPTY_FORM);
      setSelected(result.data);
      setShowDetail(true);
    } else {
      Alert.alert('Erreur', result.message);
    }
  };

  const handleAddPayment = async () => {
    if (!payForm.amount) {
      Alert.alert(lang === 'fr' ? 'Erreur' : 'Error', lang === 'fr' ? 'Montant requis' : 'Amount required');
      return;
    }
    setSaving(true);
    const result = await addPayment(selected.id, {
      amount: parseFloat(String(payForm.amount).replace(/\s/g, '')),
      reference: payForm.reference || undefined,
      notes: payForm.notes || undefined,
    });
    setSaving(false);
    if (result.success) {
      setShowAddPay(false);
      setPayForm(EMPTY_PAY);
      const refreshed = await getOne(selected.id);
      if (refreshed.success) setSelected(refreshed.data);
      load();
    } else {
      Alert.alert('Erreur', result.message);
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      lang === 'fr' ? 'Supprimer' : 'Delete',
      lang === 'fr' ? `Supprimer le reversement vers ${item.beneficiaryName} ?` : `Delete remittance to ${item.beneficiaryName}?`,
      [
        { text: lang === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'fr' ? 'Supprimer' : 'Delete', style: 'destructive',
          onPress: async () => {
            await remove(item.id);
            setShowDetail(false);
            load();
          }
        }
      ]
    );
  };

  const openDetail = async (item) => {
    const res = await getOne(item.id);
    if (res.success) setSelected(res.data);
    else setSelected(item);
    setShowDetail(true);
  };

  const FILTERS = [
    { key: '', label: lang === 'fr' ? 'Tous' : 'All' },
    { key: 'pending', label: lang === 'fr' ? 'En attente' : 'Pending' },
    { key: 'partial', label: lang === 'fr' ? 'Partiel' : 'Partial' },
    { key: 'completed', label: lang === 'fr' ? 'Complétés' : 'Completed' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{lang === 'fr' ? 'Reversements' : 'Remittances'}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowNew(true)}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Stats banner */}
      {stats && (
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>{lang === 'fr' ? 'Total' : 'Total'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>{stats.pending + stats.partial}</Text>
            <Text style={styles.statLabel}>{lang === 'fr' ? 'En cours' : 'Ongoing'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.danger }]}>{fmt(stats.totalDue)}</Text>
            <Text style={styles.statLabel}>{lang === 'fr' ? 'Reste dû' : 'Due'} (FCFA)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>{lang === 'fr' ? 'Complétés' : 'Done'}</Text>
          </View>
        </View>
      )}

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filterStatus === f.key && styles.filterBtnActive]}
            onPress={() => setFilterStatus(f.key)}
          >
            <Text style={[styles.filterText, filterStatus === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={remittances}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <RemittanceCard item={item} lang={lang} onPress={openDetail} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="arrow-up-circle-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>{lang === 'fr' ? 'Aucun reversement' : 'No remittances'}</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowNew(true)}>
                <Text style={styles.emptyBtnText}>{lang === 'fr' ? '+ Nouveau reversement' : '+ New remittance'}</Text>
              </TouchableOpacity>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />

      {/* ── NEW REMITTANCE MODAL ── */}
      <Modal visible={showNew} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{lang === 'fr' ? 'Nouveau reversement' : 'New remittance'}</Text>
              <TouchableOpacity onPress={() => { setShowNew(false); setForm(EMPTY_FORM); }}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.sectionNote}>
                {lang === 'fr'
                  ? 'Enregistrez un reversement que vous devez effectuer vers une banque ou un fournisseur de devises.'
                  : 'Record a remittance you need to make to a bank or currency provider.'}
              </Text>

              {[
                { key: 'beneficiaryName', label: lang === 'fr' ? 'Bénéficiaire *' : 'Beneficiary *', placeholder: 'Banque / Fournisseur', required: true },
                { key: 'beneficiaryBank', label: lang === 'fr' ? 'Banque / Institution' : 'Bank / Institution', placeholder: 'SGBC, Ecobank, Coris...' },
                { key: 'beneficiaryAccount', label: lang === 'fr' ? 'N° Compte (optionnel)' : 'Account No. (optional)', placeholder: '001-XXXX-XXXX' },
                { key: 'beneficiaryPhone', label: lang === 'fr' ? 'Téléphone (optionnel)' : 'Phone (optional)', placeholder: '+237 6XX XXX XXX', keyboard: 'phone-pad' },
              ].map(f => (
                <View key={f.key} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={f.placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={form[f.key]}
                    onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                    keyboardType={f.keyboard || 'default'}
                  />
                </View>
              ))}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{lang === 'fr' ? 'Montant total à reverser *' : 'Total amount to remit *'}</Text>
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputLarge]}
                  placeholder="5 000 000"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.totalAmount}
                  onChangeText={v => setForm(p => ({ ...p, totalAmount: v }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{lang === 'fr' ? 'Devise' : 'Currency'}</Text>
                <View style={styles.currencyRow}>
                  {['FCFA', 'EUR', 'USD', 'XOF'].map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.currencyBtn, form.currency === c && styles.currencyBtnActive]}
                      onPress={() => setForm(p => ({ ...p, currency: c }))}
                    >
                      <Text style={[styles.currencyText, form.currency === c && styles.currencyTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{lang === 'fr' ? 'Notes (optionnel)' : 'Notes (optional)'}</Text>
                <TextInput
                  style={[styles.fieldInput, { height: 72, textAlignVertical: 'top' }]}
                  placeholder={lang === 'fr' ? 'Motif, référence contrat...' : 'Reason, contract ref...'}
                  placeholderTextColor={COLORS.textMuted}
                  value={form.notes}
                  onChangeText={v => setForm(p => ({ ...p, notes: v }))}
                  multiline
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.submitText}>{lang === 'fr' ? 'Créer le reversement' : 'Create remittance'}</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── DETAIL MODAL ── */}
      <Modal visible={showDetail && !!selected} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selected && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selected.reference}</Text>
                  <TouchableOpacity onPress={() => setShowDetail(false)}>
                    <Ionicons name="close" size={22} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Summary */}
                  <View style={styles.summaryBox}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>{lang === 'fr' ? 'Total' : 'Total'}</Text>
                        <Text style={styles.summaryValue}>{fmt(selected.totalAmount)}</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>{lang === 'fr' ? 'Reversé' : 'Paid'}</Text>
                        <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{fmt(selected.paidAmount)}</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>{lang === 'fr' ? 'Restant' : 'Left'}</Text>
                        <Text style={[styles.summaryValue, { color: parseFloat(selected.remainingAmount) > 0 ? COLORS.warning : COLORS.primary }]}>
                          {fmt(selected.remainingAmount)}
                        </Text>
                      </View>
                    </View>
                    <ProgressBar paid={selected.paidAmount} total={selected.totalAmount} />
                    <View style={{ marginTop: 8 }}>
                      <Badge status={selected.status} lang={lang} />
                    </View>
                  </View>

                  {/* Info rows */}
                  {[
                    { label: lang === 'fr' ? 'Bénéficiaire' : 'Beneficiary', value: selected.beneficiaryName },
                    { label: lang === 'fr' ? 'Banque' : 'Bank', value: selected.beneficiaryBank || '—' },
                    { label: lang === 'fr' ? 'N° Compte' : 'Account', value: selected.beneficiaryAccount || '—' },
                    { label: lang === 'fr' ? 'Téléphone' : 'Phone', value: selected.beneficiaryPhone || '—' },
                    { label: lang === 'fr' ? 'Devise' : 'Currency', value: selected.currency },
                    { label: 'Notes', value: selected.notes || '—' },
                  ].map(row => (
                    <View key={row.label} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{row.label}</Text>
                      <Text style={styles.detailValue} numberOfLines={2}>{row.value}</Text>
                    </View>
                  ))}

                  {/* Payments history */}
                  <View style={styles.paymentsSection}>
                    <Text style={styles.paymentsSectionTitle}>
                      {lang === 'fr' ? 'Historique des versements' : 'Payment history'} ({(selected.payments || []).length})
                    </Text>
                    {(selected.payments || []).length === 0 && (
                      <Text style={styles.noPayments}>{lang === 'fr' ? 'Aucun versement effectué' : 'No payments yet'}</Text>
                    )}
                    {(selected.payments || []).map((p, i) => (
                      <View key={p.id} style={styles.paymentRow}>
                        <View style={styles.paymentIndex}>
                          <Text style={styles.paymentIndexText}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.paymentAmount}>{fmt(p.amount)} {selected.currency}</Text>
                            <Text style={styles.paymentDate}>
                              {new Date(p.paidAt).toLocaleDateString('fr-FR')}
                            </Text>
                          </View>
                          {p.reference ? <Text style={styles.paymentRef}>Réf: {p.reference}</Text> : null}
                          {p.notes ? <Text style={styles.paymentNotes}>{p.notes}</Text> : null}
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Action buttons */}
                  <View style={styles.actionRow}>
                    {selected.status !== 'completed' && selected.status !== 'cancelled' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                        onPress={() => { setShowDetail(false); setTimeout(() => setShowAddPay(true), 300); }}
                      >
                        <Ionicons name="add" size={16} color={COLORS.white} />
                        <Text style={styles.actionBtnText}>{lang === 'fr' ? 'Ajouter versement' : 'Add payment'}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: COLORS.dangerLight, flex: 0.4 }]}
                      onPress={() => handleDelete(selected)}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── ADD PAYMENT MODAL ── */}
      <Modal visible={showAddPay} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '55%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{lang === 'fr' ? 'Ajouter un versement' : 'Add payment'}</Text>
              <TouchableOpacity onPress={() => setShowAddPay(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {selected && (
              <Text style={styles.payRemaining}>
                {lang === 'fr' ? 'Reste à reverser' : 'Remaining'} : <Text style={{ color: COLORS.warning, fontWeight: '700' }}>{fmt(selected.remainingAmount)} {selected.currency}</Text>
              </Text>
            )}
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{lang === 'fr' ? 'Montant versé *' : 'Amount paid *'}</Text>
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputLarge]}
                  placeholder="200 000"
                  placeholderTextColor={COLORS.textMuted}
                  value={payForm.amount}
                  onChangeText={v => setPayForm(p => ({ ...p, amount: v }))}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{lang === 'fr' ? 'Référence (optionnel)' : 'Reference (optional)'}</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder={lang === 'fr' ? 'N° virement, reçu...' : 'Transfer no., receipt...'}
                  placeholderTextColor={COLORS.textMuted}
                  value={payForm.reference}
                  onChangeText={v => setPayForm(p => ({ ...p, reference: v }))}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder={lang === 'fr' ? 'Notes optionnelles...' : 'Optional notes...'}
                  placeholderTextColor={COLORS.textMuted}
                  value={payForm.notes}
                  onChangeText={v => setPayForm(p => ({ ...p, notes: v }))}
                />
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddPayment} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.submitText}>{lang === 'fr' ? 'Confirmer le versement' : 'Confirm payment'}</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingTop: 52, paddingBottom: 14, paddingHorizontal: SPACING.md },
  backBtn: { marginRight: SPACING.sm, padding: 4 },
  title: { flex: 1, fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  statsBanner: { flexDirection: 'row', backgroundColor: COLORS.white, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },

  filterScroll: { maxHeight: 44, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.sm, gap: SPACING.xs },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: RADIUS.full, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '500' },
  filterTextActive: { color: COLORS.white, fontWeight: '700' },

  list: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: 100 },

  card: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  cardLeft: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  cardBody: { flex: 1, gap: 4 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  cardRef: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontFamily: 'monospace' },
  cardBank: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  cardAmount: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  cardRemaining: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },

  progressBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginVertical: 4 },
  progressFill: { height: 4, borderRadius: 2 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  badgeText: { fontSize: 10, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.textMuted },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  emptyBtnText: { color: COLORS.white, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.md, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary },

  sectionNote: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, backgroundColor: COLORS.infoLight, padding: SPACING.sm, borderRadius: RADIUS.md, marginBottom: SPACING.md, lineHeight: 18 },

  fieldGroup: { marginBottom: SPACING.md },
  fieldLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  fieldInput: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  fieldInputLarge: { fontSize: FONTS.sizes.xl, fontWeight: '700', paddingVertical: 14 },

  currencyRow: { flexDirection: 'row', gap: SPACING.sm },
  currencyBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  currencyBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  currencyText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  currencyTextActive: { color: COLORS.white },

  submitBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm, marginBottom: SPACING.xl },
  submitText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md },

  summaryBox: { backgroundColor: COLORS.background, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.sm },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginBottom: 2 },
  summaryValue: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  detailLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, flex: 1 },
  detailValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, flex: 2, textAlign: 'right' },

  paymentsSection: { marginTop: SPACING.md },
  paymentsSectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  noPayments: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center', padding: SPACING.md },
  paymentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  paymentIndex: { width: 26, height: 26, borderRadius: RADIUS.full, backgroundColor: COLORS.primaryGlow, alignItems: 'center', justifyContent: 'center' },
  paymentIndexText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.primary },
  paymentAmount: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  paymentDate: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  paymentRef: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  paymentNotes: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontStyle: 'italic' },

  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md, marginBottom: SPACING.xl },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: RADIUS.md, paddingVertical: 12 },
  actionBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.sm },

  payRemaining: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.md, backgroundColor: COLORS.warningLight, padding: SPACING.sm, borderRadius: RADIUS.md },
});
