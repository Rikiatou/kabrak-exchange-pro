import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import useAuthStore from '../../src/store/authStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useLanguageStore from '../../src/store/languageStore';
import { formatDateTime } from '../../src/utils/helpers';

const ACTION_COLORS = {
  CREATE: COLORS.success,
  UPDATE: COLORS.warning,
  DELETE: COLORS.danger,
  OPEN_DAY: COLORS.primary,
  CLOSE_DAY: COLORS.secondary,
};

const ACTION_ICONS = {
  CREATE: 'add-circle-outline',
  UPDATE: 'pencil-outline',
  DELETE: 'trash-outline',
  OPEN_DAY: 'sunny-outline',
  CLOSE_DAY: 'moon-outline',
};

function AuditItem({ log }) {
  const color = ACTION_COLORS[log.action] || COLORS.textSecondary;
  const icon = ACTION_ICONS[log.action] || 'information-circle-outline';
  return (
    <View style={styles.logItem}>
      <View style={[styles.logIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.logBody}>
        <View style={styles.logTop}>
          <Text style={styles.logAction}>{log.action}</Text>
          <View style={[styles.entityBadge, { backgroundColor: `${color}18` }]}>
            <Text style={[styles.entityText, { color }]}>{log.entity?.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.logUser}>{log.userName || 'Système'}</Text>
        <Text style={styles.logDate}>{formatDateTime(log.createdAt)}</Text>
      </View>
    </View>
  );
}

export default function AuditLogScreen() {
  const router = useRouter();
  const { t } = useLanguageStore();
  const { user } = useAuthStore();

  const isOwner = user?.teamRole === 'owner';
  useEffect(() => {
    if (user && !isOwner) { router.back(); }
  }, [user]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadLogs = async (p = 1, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.get('/audit', { params: { page: p, limit: 30 } });
      const newLogs = res.data.data || [];
      setLogs(reset ? newLogs : (prev) => [...prev, ...newLogs]);
      setHasMore(newLogs.length === 30);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { loadLogs(1, true); }, []);

  const onRefresh = () => { setPage(1); loadLogs(1, true); };

  const loadMore = () => {
    if (hasMore && !loading) {
      const next = page + 1;
      setPage(next);
      loadLogs(next);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{t.audit.title}</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AuditItem log={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading && page === 1} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="shield-checkmark-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>{t.audit.noLogs}</Text>
            </View>
          )
        }
        ListFooterComponent={
          hasMore && logs.length > 0 ? (
            <TouchableOpacity style={styles.loadMore} onPress={loadMore}>
              <Text style={styles.loadMoreText}>{t.common.refresh}</Text>
            </TouchableOpacity>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingTop: 56, paddingBottom: SPACING.lg
  },
  backBtn: { padding: 4 },
  title: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  list: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  logItem: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.white,
    borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2
  },
  logIcon: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm
  },
  logBody: { flex: 1 },
  logTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  logAction: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary },
  entityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  entityText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  logUser: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  logDate: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary, fontWeight: '600' },
  loadMore: {
    alignItems: 'center', paddingVertical: SPACING.md,
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, marginTop: SPACING.sm
  },
  loadMoreText: { color: COLORS.primary, fontWeight: '600', fontSize: FONTS.sizes.sm }
});
