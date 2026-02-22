import { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useCurrencyStore from '../../src/store/currencyStore';
import useAuthStore from '../../src/store/authStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useLanguageStore from '../../src/store/languageStore';
import { formatCurrency } from '../../src/utils/helpers';

function CurrencyCard({ currency, onPress, isAdmin, buyLabel, sellLabel }) {
  const isLowStock = parseFloat(currency.stockAmount) <= parseFloat(currency.lowStockAlert);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{currency.code}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{currency.name}</Text>
          <Text style={styles.symbol}>{currency.symbol}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.rate}>1 EUR = {parseFloat(currency.currentRate).toFixed(4)}</Text>
        <View style={styles.rateRow}>
          <Text style={styles.buyRate}>{buyLabel}: {parseFloat(currency.buyRate || currency.currentRate).toFixed(4)}</Text>
          <Text style={styles.sellRate}>{sellLabel}: {parseFloat(currency.sellRate || currency.currentRate).toFixed(4)}</Text>
        </View>
        <View style={[styles.stockBadge, { backgroundColor: isLowStock ? COLORS.dangerLight : COLORS.successLight }]}>
          <Ionicons
            name={isLowStock ? 'warning-outline' : 'checkmark-circle-outline'}
            size={12}
            color={isLowStock ? COLORS.danger : COLORS.success}
          />
          <Text style={[styles.stockText, { color: isLowStock ? COLORS.danger : COLORS.success }]}>
            Stock: {formatCurrency(currency.stockAmount, currency.code)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CurrenciesScreen() {
  const { currencies, isLoading, fetchCurrencies } = useCurrencyStore();
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  useEffect(() => { fetchCurrencies(); }, []);

  const onRefresh = useCallback(() => fetchCurrencies(), []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.currencies.title}</Text>
        {isAdmin && (
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/currencies/new')}>
            <Ionicons name="add" size={22} color={COLORS.white} />
            <Text style={styles.addBtnText}>{t.common.add}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={currencies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CurrencyCard
            currency={item}
            isAdmin={isAdmin}
            onPress={() => router.push(`/currencies/${item.id}`)}
            buyLabel={t.currencies.buyRate}
            sellLabel={t.currencies.sellRate}
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
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary, fontWeight: '600' }
});
