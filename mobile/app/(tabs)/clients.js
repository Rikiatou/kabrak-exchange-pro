import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useClientStore from '../../src/store/clientStore';
import useLanguageStore from '../../src/store/languageStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import { formatCurrency, getInitials } from '../../src/utils/helpers';

function ClientCard({ client, onPress, owesLabel, paidLabel }) {
  const hasDebt = parseFloat(client.totalDebt) > 0;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, { backgroundColor: hasDebt ? COLORS.dangerLight : COLORS.successLight }]}>
          <Text style={[styles.avatarText, { color: hasDebt ? COLORS.danger : COLORS.success }]}>
            {getInitials(client.name)}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{client.name}</Text>
          <Text style={styles.phone}>{client.phone || client.email || 'Pas de contact'}</Text>
          {client.idNumber && <Text style={styles.id}>ID: {client.idNumber}</Text>}
        </View>
      </View>
      <View style={styles.cardRight}>
        {hasDebt ? (
          <>
            <Text style={styles.debtAmount}>{formatCurrency(client.totalDebt)}</Text>
            <Text style={styles.debtLabel}>{owesLabel}</Text>
          </>
        ) : (
          <View style={styles.paidBadge}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.paidText}>{paidLabel}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );
}

export default function ClientsScreen() {
  const [search, setSearch] = useState('');
  const { clients, isLoading, fetchClients } = useClientStore();
  const { t } = useLanguageStore();
  const router = useRouter();

  useEffect(() => { fetchClients(); }, []);

  const onRefresh = useCallback(() => fetchClients({ search }), [search]);

  const handleSearch = useCallback((text) => {
    setSearch(text);
    fetchClients({ search: text });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.clients.title}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/clients/new')}>
          <Ionicons name="person-add" size={20} color={COLORS.white} />
          <Text style={styles.addBtnText}>{t.clients.new}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.clients.search}
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ClientCard client={item} onPress={() => router.push(`/clients/${item.id}`)} owesLabel={t.dashboard.owes} paidLabel={t.common.paid} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>{t.clients.noClients}</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/clients/new')}>
                <Text style={styles.emptyBtnText}>{t.clients.addFirst}</Text>
              </TouchableOpacity>
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
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 8
  },
  addBtnText: { color: COLORS.white, fontWeight: '600', fontSize: FONTS.sizes.sm },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg, marginVertical: SPACING.md,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 46, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  avatarText: { fontWeight: '700', fontSize: FONTS.sizes.md },
  info: { flex: 1 },
  name: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary },
  phone: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  id: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 1 },
  cardRight: { alignItems: 'flex-end', marginLeft: SPACING.sm },
  debtAmount: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.danger },
  debtLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  paidText: { fontSize: FONTS.sizes.xs, color: COLORS.success, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary, fontWeight: '600' },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
  emptyBtnText: { color: COLORS.white, fontWeight: '700' }
});
