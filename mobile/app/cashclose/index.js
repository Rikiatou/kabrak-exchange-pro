import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, ActivityIndicator, RefreshControl, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useCashCloseStore from '../../src/store/cashCloseStore';
import useAuthStore from '../../src/store/authStore';

const fmt = (n) => parseFloat(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function CashCloseScreen() {
  const router = useRouter();
  const { closes, todaySummary, loading, fetchAll, fetchToday, closeDay } = useCashCloseStore();
  const { user } = useAuthStore();
  const isOwner = user?.teamRole === 'owner';

  const [showModal, setShowModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('today');

  useEffect(() => { load(); }, []);

  const load = useCallback(() => {
    fetchToday();
    fetchAll();
  }, []);

  const handleClose = async () => {
    if (!isOwner) { Alert.alert('Accès refusé', 'Seul le propriétaire peut clôturer la caisse.'); return; }
    if (todaySummary?.alreadyClosed) { Alert.alert('Déjà clôturée', 'La caisse de ce jour est déjà clôturée.'); return; }
    Alert.alert(
      'Clôturer la caisse',
      `Confirmer la clôture du ${todaySummary?.date} ?\nSolde de clôture estimé: ${fmt(todaySummary?.summary?.netCash + parseFloat(openingBalance || 0))} FCFA`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Clôturer', style: 'destructive',
          onPress: async () => {
            setSaving(true);
            const result = await closeDay({ openingBalance: parseFloat(openingBalance || 0), notes, currency: 'FCFA' });
            setSaving(false);
            if (result.success) {
              setShowModal(false);
              Alert.alert('✅ Caisse clôturée', 'La clôture a été enregistrée avec succès.');
              load();
            } else {
              Alert.alert('Erreur', result.message);
            }
          }
        }
      ]
    );
  };

  const s = todaySummary?.summary || {};

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clôture de caisse</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['today', 'history'].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'today' ? "Aujourd'hui" : 'Historique'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[COLORS.primary]} />}
      >
        {tab === 'today' && todaySummary && (
          <View style={{ padding: SPACING.lg }}>
            {/* Status banner */}
            <View style={[styles.statusBanner, { backgroundColor: todaySummary.alreadyClosed ? '#e6f4ef' : '#fef3c7' }]}>
              <Ionicons
                name={todaySummary.alreadyClosed ? 'checkmark-circle' : 'time-outline'}
                size={20}
                color={todaySummary.alreadyClosed ? COLORS.primary : '#d97706'}
              />
              <Text style={[styles.statusText, { color: todaySummary.alreadyClosed ? COLORS.primary : '#d97706' }]}>
                {todaySummary.alreadyClosed ? 'Caisse clôturée' : 'Caisse ouverte — ' + todaySummary.date}
              </Text>
            </View>

            {/* Summary cards */}
            <View style={styles.grid}>
              {[
                { label: 'Transactions', value: s.totalTransactions || 0, icon: 'swap-horizontal', color: COLORS.primary },
                { label: 'Paiements reçus', value: `${fmt(s.totalPaymentsReceived)} FCFA`, icon: 'cash-outline', color: '#0369a1' },
                { label: 'Entrées caisse', value: `${fmt(s.totalIncome)} FCFA`, icon: 'trending-up', color: '#16a34a' },
                { label: 'Sorties caisse', value: `${fmt(s.totalExpense)} FCFA`, icon: 'trending-down', color: '#dc2626' },
                { label: 'Versements conf.', value: `${fmt(s.totalDepositsConfirmed)} FCFA`, icon: 'wallet-outline', color: '#7c3aed' },
                { label: 'Net caisse', value: `${fmt(s.netCash)} FCFA`, icon: 'calculator-outline', color: '#d97706' },
              ].map((item) => (
                <View key={item.label} style={styles.gridCard}>
                  <View style={[styles.gridIcon, { backgroundColor: `${item.color}15` }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={styles.gridValue} numberOfLines={1}>{item.value}</Text>
                  <Text style={styles.gridLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* By currency */}
            {todaySummary.byCurrency && Object.keys(todaySummary.byCurrency).length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Par devise</Text>
                {Object.entries(todaySummary.byCurrency).map(([cur, data]) => (
                  <View key={cur} style={styles.row}>
                    <Text style={styles.rowLabel}>{cur}</Text>
                    <Text style={styles.rowValue}>{data.count} tx — {fmt(data.volume)} {cur}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* By payment method */}
            {todaySummary.byMethod && Object.keys(todaySummary.byMethod).length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Par mode de paiement</Text>
                {Object.entries(todaySummary.byMethod).map(([method, amount]) => (
                  <View key={method} style={styles.row}>
                    <Text style={styles.rowLabel}>{method.replace('_', ' ')}</Text>
                    <Text style={styles.rowValue}>{fmt(amount)} FCFA</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Close button */}
            {isOwner && !todaySummary.alreadyClosed && (
              <View style={styles.closeSection}>
                <Text style={styles.closeLabel}>Solde d'ouverture (FCFA)</Text>
                <TextInput
                  style={styles.closeInput}
                  value={openingBalance}
                  onChangeText={setOpeningBalance}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.closeLabel}>Notes (optionnel)</Text>
                <TextInput
                  style={[styles.closeInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="Observations de fin de journée..."
                  placeholderTextColor={COLORS.textMuted}
                />
                <TouchableOpacity style={styles.closeBtn} onPress={handleClose} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color={COLORS.white} />
                    : <>
                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.white} />
                        <Text style={styles.closeBtnText}>Clôturer la caisse</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {tab === 'history' && (
          <View style={{ padding: SPACING.lg }}>
            {closes.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="document-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>Aucune clôture enregistrée</Text>
              </View>
            )}
            {closes.map((c) => (
              <View key={c.id} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyDate}>{c.date}</Text>
                  <View style={[styles.badge, { backgroundColor: '#e6f4ef' }]}>
                    <Text style={[styles.badgeText, { color: COLORS.primary }]}>Clôturé</Text>
                  </View>
                </View>
                <View style={styles.historyRow}>
                  <Text style={styles.historyLabel}>Paiements reçus</Text>
                  <Text style={styles.historyValue}>{fmt(c.totalPaymentsReceived)} {c.currency}</Text>
                </View>
                <View style={styles.historyRow}>
                  <Text style={styles.historyLabel}>Solde clôture</Text>
                  <Text style={[styles.historyValue, { color: COLORS.primary, fontWeight: '700' }]}>{fmt(c.closingBalance)} {c.currency}</Text>
                </View>
                <View style={styles.historyRow}>
                  <Text style={styles.historyLabel}>Transactions</Text>
                  <Text style={styles.historyValue}>{c.totalTransactions}</Text>
                </View>
                {c.closer && (
                  <Text style={styles.historyBy}>Clôturé par {c.closer.name}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingTop: 56, paddingBottom: SPACING.lg,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md,
  },
  statusText: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.md },
  gridCard: {
    width: '47%', backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  gridIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridValue: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  gridLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  rowLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  rowValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  closeSection: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm },
  closeLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6, marginTop: SPACING.sm },
  closeInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 48, fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary, backgroundColor: COLORS.background,
  },
  closeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 52, marginTop: SPACING.md,
  },
  closeBtnText: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.textMuted, marginTop: 12 },
  historyCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  historyDate: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  historyLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  historyValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  historyBy: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 6, fontStyle: 'italic' },
});
