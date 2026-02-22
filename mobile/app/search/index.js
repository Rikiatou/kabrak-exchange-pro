import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import api from '../../src/services/api';
import { formatCurrency } from '../../src/utils/helpers';

const STATUS_COLOR = {
  paid: '#16a34a', partial: '#d97706', unpaid: '#dc2626',
  pending: '#d97706', confirmed: '#16a34a', rejected: '#dc2626',
  active: '#16a34a', inactive: '#94a3b8',
};

function SectionHeader({ title, count }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.countBadge}><Text style={styles.countText}>{count}</Text></View>
    </View>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 2) { setResults(null); setError(null); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(q.trim())}`);
      setResults(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de recherche');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 500);
  };

  const hasResults = results && results.total > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={handleChange}
            placeholder="Rechercher clients, transactions, devises..."
            placeholderTextColor={COLORS.textMuted}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => doSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults(null); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Recherche en cours...</Text>
          </View>
        )}

        {error && (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={36} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && query.length >= 2 && results && results.total === 0 && (
          <View style={styles.center}>
            <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptyDesc}>Aucun résultat pour « {query} »</Text>
          </View>
        )}

        {!loading && query.length < 2 && !results && (
          <View style={styles.center}>
            <Ionicons name="search-outline" size={56} color="#e2e8f0" />
            <Text style={styles.hintTitle}>Recherche globale</Text>
            <Text style={styles.hintDesc}>Tapez au moins 2 caractères pour rechercher dans les clients, transactions, devises et versements.</Text>
          </View>
        )}

        {hasResults && (
          <View style={{ padding: SPACING.md }}>
            {/* Clients */}
            {results.clients.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Clients" count={results.clients.length} />
                {results.clients.map((c) => (
                  <TouchableOpacity key={c.id} style={styles.card} onPress={() => router.push(`/clients/${c.id}`)}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{c.name?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.cardMid}>
                      <Text style={styles.cardTitle}>{c.name}</Text>
                      <Text style={styles.cardSub}>{c.phone || c.email || '—'}</Text>
                    </View>
                    <View style={styles.cardRight}>
                      {parseFloat(c.totalDebt) > 0 && (
                        <Text style={styles.debtAmt}>{formatCurrency(c.totalDebt)}</Text>
                      )}
                      <View style={[styles.badge, { backgroundColor: c.isActive ? '#e6f4ef' : '#f1f5f9' }]}>
                        <Text style={[styles.badgeText, { color: c.isActive ? COLORS.primary : '#94a3b8' }]}>
                          {c.isActive ? 'Actif' : 'Inactif'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Transactions */}
            {results.transactions.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Transactions" count={results.transactions.length} />
                {results.transactions.map((t) => (
                  <TouchableOpacity key={t.id} style={styles.card} onPress={() => router.push(`/transactions/${t.id}`)}>
                    <View style={[styles.iconBox, { backgroundColor: '#e6f4ef' }]}>
                      <Ionicons name="swap-horizontal" size={18} color={COLORS.primary} />
                    </View>
                    <View style={styles.cardMid}>
                      <Text style={styles.cardTitle}>{t.reference}</Text>
                      <Text style={styles.cardSub}>{t.client?.name} · {t.currencyFrom} → {t.currencyTo}</Text>
                    </View>
                    <View style={styles.cardRight}>
                      <Text style={styles.cardAmt}>{formatCurrency(t.amountTo, t.currencyTo)}</Text>
                      <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[t.status]}18` }]}>
                        <Text style={[styles.badgeText, { color: STATUS_COLOR[t.status] }]}>{t.status}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Deposit Orders */}
            {results.depositOrders.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Versements" count={results.depositOrders.length} />
                {results.depositOrders.map((d) => (
                  <TouchableOpacity key={d.id} style={styles.card} onPress={() => router.push('/deposits')}>
                    <View style={[styles.iconBox, { backgroundColor: '#ede9fe' }]}>
                      <Ionicons name="wallet-outline" size={18} color="#7c3aed" />
                    </View>
                    <View style={styles.cardMid}>
                      <Text style={styles.cardTitle}>{d.orderCode}</Text>
                      <Text style={styles.cardSub}>{d.client?.name}</Text>
                    </View>
                    <View style={styles.cardRight}>
                      <Text style={styles.cardAmt}>{formatCurrency(d.totalAmount, d.currency)}</Text>
                      <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[d.status] || '#94a3b8'}18` }]}>
                        <Text style={[styles.badgeText, { color: STATUS_COLOR[d.status] || '#94a3b8' }]}>{d.status}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Currencies */}
            {results.currencies.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Devises" count={results.currencies.length} />
                {results.currencies.map((c) => (
                  <TouchableOpacity key={c.id} style={styles.card} onPress={() => router.push(`/currencies/${c.id}`)}>
                    <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#d97706' }}>{c.symbol}</Text>
                    </View>
                    <View style={styles.cardMid}>
                      <Text style={styles.cardTitle}>{c.code} — {c.name}</Text>
                      <Text style={styles.cardSub}>Taux: {parseFloat(c.currentRate).toFixed(4)}</Text>
                    </View>
                    <View style={styles.cardRight}>
                      <Text style={styles.cardAmt}>{parseFloat(c.stockAmount).toLocaleString()} en stock</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md,
    paddingTop: 52, paddingBottom: SPACING.md,
  },
  backBtn: { padding: 4 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 44,
  },
  searchInput: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.textPrimary, height: 44 },
  center: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  loadingText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 12 },
  errorText: { fontSize: FONTS.sizes.sm, color: COLORS.danger, marginTop: 12, textAlign: 'center' },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 },
  emptyDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
  hintTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: '#cbd5e1', marginTop: 16 },
  hintDesc: { fontSize: FONTS.sizes.sm, color: '#cbd5e1', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  section: { marginBottom: SPACING.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  countBadge: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  countText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md },
  iconBox: { width: 44, height: 44, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  cardMid: { flex: 1 },
  cardTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary },
  cardSub: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardAmt: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textPrimary },
  debtAmt: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: '#dc2626' },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.full },
  badgeText: { fontSize: 10, fontWeight: '700' },
});
