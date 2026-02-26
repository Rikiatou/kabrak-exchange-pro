import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, ActivityIndicator, RefreshControl, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useCurrencyStore from '../../src/store/currencyStore';
import useAuthStore from '../../src/store/authStore';

const fmt = (n) => parseFloat(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function StockScreen() {
  const router = useRouter();
  const { getStockSummary, adjustStock } = useCurrencyStore();
  const { user } = useAuthStore();
  const isOwner = user?.teamRole === 'owner';

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [adjType, setAdjType] = useState('add');
  const [adjAmount, setAdjAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { load(); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getStockSummary();
    if (result.success) setStocks(result.data);
    setLoading(false);
  }, []);

  const openAdjust = (currency) => {
    if (!isOwner) { Alert.alert('Accès refusé', 'Seul le propriétaire peut ajuster le stock.'); return; }
    setSelected(currency);
    setAdjType('add');
    setAdjAmount('');
    setShowModal(true);
  };

  const handleAdjust = async () => {
    const amt = parseFloat(adjAmount);
    if (!amt || amt <= 0) { Alert.alert('Erreur', 'Montant invalide'); return; }
    setSaving(true);
    const result = await adjustStock(selected.id, amt, adjType);
    setSaving(false);
    if (result.success) {
      setShowModal(false);
      Alert.alert('✅ Stock mis à jour', `${selected.code}: ${fmt(result.data.previousStock)} → ${fmt(result.data.newStock)}`);
      load();
    } else {
      Alert.alert('Erreur', result.message);
    }
  };

  const totalLow = stocks.filter(s => s.isLow).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock de devises</Text>
        <View style={{ width: 32 }} />
      </View>

      {totalLow > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning-outline" size={18} color="#d97706" />
          <Text style={styles.alertText}>{totalLow} devise{totalLow > 1 ? 's' : ''} en stock bas</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[COLORS.primary]} />}
        contentContainerStyle={{ padding: SPACING.lg }}
      >
        {loading && stocks.length === 0 && (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        )}

        {stocks.map((c) => {
          if (c.isBase) return null;
          const pct = c.lowStockAlert > 0 ? Math.min((c.stockAmount / (c.lowStockAlert * 3)) * 100, 100) : 100;
          return (
            <View key={c.id} style={[styles.card, c.isLow && styles.cardLow]}>
              <View style={styles.cardTop}>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{c.code}</Text>
                </View>
                <View style={styles.cardMid}>
                  <Text style={styles.currName}>{c.name}</Text>
                  <Text style={styles.currRate}>{c.isBase ? '★ Devise de référence' : `1 ${c.code} = ${c.currentRate.toFixed(2)} [base] · A:${c.buyRate.toFixed(2)} · V:${c.sellRate.toFixed(2)}`}</Text>
                </View>
                {c.isLow && (
                  <View style={styles.lowBadge}>
                    <Ionicons name="warning-outline" size={12} color="#d97706" />
                    <Text style={styles.lowText}>Bas</Text>
                  </View>
                )}
              </View>

              <View style={styles.stockRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: c.isLow ? '#d97706' : COLORS.primary }]} />
                  </View>
                  <View style={styles.stockNums}>
                    <Text style={[styles.stockAmt, { color: c.isLow ? '#d97706' : COLORS.primary }]}>
                      {fmt(c.stockAmount)} {c.code}
                    </Text>
                    <Text style={styles.stockMin}>min: {fmt(c.lowStockAlert)}</Text>
                  </View>
                </View>
                {isOwner && (
                  <TouchableOpacity style={styles.adjBtn} onPress={() => openAdjust(c)}>
                    <Ionicons name="create-outline" size={18} color={COLORS.white} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Adjust Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Ajuster stock — {selected?.code}</Text>
            <Text style={styles.modalCurrent}>Stock actuel: {fmt(selected?.stockAmount)} {selected?.code}</Text>

            <View style={styles.typeRow}>
              {[
                { key: 'add', label: '+ Ajouter', color: '#16a34a' },
                { key: 'subtract', label: '- Retirer', color: '#dc2626' },
                { key: 'set', label: '= Définir', color: '#0369a1' },
              ].map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeBtn, adjType === t.key && { backgroundColor: t.color }]}
                  onPress={() => setAdjType(t.key)}
                >
                  <Text style={[styles.typeBtnText, adjType === t.key && { color: COLORS.white }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.adjInput}
              value={adjAmount}
              onChangeText={setAdjAmount}
              keyboardType="decimal-pad"
              placeholder="Montant"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAdjust} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.confirmBtnText}>Confirmer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef3c7', paddingHorizontal: SPACING.lg, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#fde68a',
  },
  alertText: { fontSize: FONTS.sizes.sm, color: '#d97706', fontWeight: '600' },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardLow: { borderLeftWidth: 3, borderLeftColor: '#d97706' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  codeBox: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  codeText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md },
  cardMid: { flex: 1 },
  currName: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary },
  currRate: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  lowBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  lowText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: '#d97706' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  barBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: '100%', borderRadius: 3 },
  stockNums: { flexDirection: 'row', justifyContent: 'space-between' },
  stockAmt: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  stockMin: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  adjBtn: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl, paddingBottom: 40,
  },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  modalCurrent: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center',
  },
  typeBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary },
  adjInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 52, fontSize: FONTS.sizes.lg,
    color: COLORS.textPrimary, backgroundColor: COLORS.background, marginBottom: SPACING.md,
  },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, height: 50, borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
  },
  cancelBtnText: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textSecondary },
  confirmBtn: {
    flex: 2, height: 50, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  confirmBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
});
