import { useEffect, useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useCurrencyStore from '../../src/store/currencyStore';
import useAuthStore from '../../src/store/authStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useLanguageStore from '../../src/store/languageStore';
import { formatCurrency } from '../../src/utils/helpers';
import api from '../../src/services/api';

function CurrencyCard({ currency, onPress, isAdmin, buyLabel, sellLabel, baseCurrency }) {
  const stock = parseFloat(currency.stockAmount || 0);
  const alertThreshold = parseFloat(currency.lowStockAlert || 0);
  const isLowStock = alertThreshold > 0 && stock <= alertThreshold;
  const isBase = currency.isBase;
  const base = baseCurrency || 'FCFA';
  const rateLabel = isBase ? `Devise de référence` : `1 ${currency.code} = ${parseFloat(currency.currentRate).toFixed(2)} ${base}`;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <View style={[styles.codeBox, isBase && { backgroundColor: '#d97706' }]}>
          <Text style={styles.codeText}>{currency.code}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{currency.name}</Text>
          <Text style={styles.symbol}>{currency.symbol}{isBase ? ' ★' : ''}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.rate}>{rateLabel}</Text>
        {!isBase && (
          <View style={styles.rateRow}>
            <Text style={styles.buyRate}>{buyLabel}: {parseFloat(currency.buyRate || currency.currentRate).toFixed(2)}</Text>
            <Text style={styles.sellRate}>{sellLabel}: {parseFloat(currency.sellRate || currency.currentRate).toFixed(2)}</Text>
          </View>
        )}
        {alertThreshold > 0 && (
          <View style={[styles.stockBadge, { backgroundColor: isLowStock ? COLORS.dangerLight : COLORS.successLight }]}>
            <Ionicons
              name={isLowStock ? 'warning-outline' : 'checkmark-circle-outline'}
              size={12}
              color={isLowStock ? COLORS.danger : COLORS.success}
            />
            <Text style={[styles.stockText, { color: isLowStock ? COLORS.danger : COLORS.success }]}>
              Stock: {formatCurrency(stock, currency.code)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function CurrenciesScreen() {
  const { currencies, isLoading, fetchCurrencies } = useCurrencyStore();
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const router = useRouter();
  const isOwner = user?.teamRole === 'owner' || user?.role === 'admin';
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => { fetchCurrencies(); }, []);

  const onRefresh = useCallback(() => fetchCurrencies(), []);

  const handleSyncRates = async () => {
    try {
      setSyncing(true);
      const res = await api.post('/currencies/sync-rates');
      const { updated, skipped, date } = res.data.data || {};
      setLastSync(date);
      await fetchCurrencies();
      Alert.alert('✅ Taux mis à jour', `${updated} devise(s) mise(s) à jour\n${skipped} inchangée(s)\nSource: marché international`);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de synchroniser les taux. Vérifiez votre connexion.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.currencies.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {isOwner && (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: syncing ? 'rgba(255,255,255,0.1)' : 'rgba(232,160,32,0.25)' }]}
              onPress={handleSyncRates}
              disabled={syncing}
            >
              {syncing
                ? <ActivityIndicator size={14} color={COLORS.white} />
                : <Ionicons name="sync-outline" size={16} color="#e8a020" />
              }
              <Text style={[styles.addBtnText, { color: '#e8a020' }]}>{syncing ? 'Sync...' : 'Taux marché'}</Text>
            </TouchableOpacity>
          )}
          {isOwner && (
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/currencies/new')}>
              <Ionicons name="add" size={22} color={COLORS.white} />
              <Text style={styles.addBtnText}>{t.common.add}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {lastSync && (
        <View style={styles.syncBanner}>
          <Ionicons name="checkmark-circle" size={13} color="#10b981" />
          <Text style={styles.syncBannerText}>Taux synchronisés le {lastSync}</Text>
        </View>
      )}

      <FlatList
        data={currencies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CurrencyCard
            currency={item}
            isAdmin={isOwner}
            onPress={() => router.push(`/currencies/${item.id}`)}
            buyLabel={t.currencies.buyRate}
            sellLabel={t.currencies.sellRate}
            baseCurrency={currencies.find(c => c.isBase)?.code}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.empty}>
              <Ionicons name="cash-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>{t.currencies.noCurrencies}</Text>
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
  list: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  codeBox: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm
  },
  codeText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.sm },
  info: { flex: 1 },
  name: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary },
  symbol: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  rate: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.primary },
  rateRow: { flexDirection: 'row', gap: 8 },
  buyRate: { fontSize: FONTS.sizes.xs, color: COLORS.success },
  sellRate: { fontSize: FONTS.sizes.xs, color: COLORS.danger },
  stockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full
  },
  stockText: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary, fontWeight: '600' },
  syncBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', paddingHorizontal: SPACING.lg, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#dcfce7' },
  syncBannerText: { fontSize: 12, color: '#15803d', fontWeight: '600' }
});
