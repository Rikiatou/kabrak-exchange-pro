import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useLanguageStore from '../../src/store/languageStore';
import { formatRelative, getSeverityConfig } from '../../src/utils/helpers';

function AlertItem({ alert, onRead }) {
  const config = getSeverityConfig(alert.severity);
  return (
    <TouchableOpacity
      style={[styles.alertCard, !alert.isRead && styles.alertCardUnread]}
      onPress={() => !alert.isRead && onRead(alert.id)}
      activeOpacity={0.8}
    >
      <View style={[styles.alertIcon, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={22} color={config.color} />
      </View>
      <View style={styles.alertBody}>
        <View style={styles.alertTop}>
          <Text style={styles.alertTitle} numberOfLines={1}>{alert.title}</Text>
          {!alert.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
        <Text style={styles.alertTime}>{formatRelative(alert.createdAt)}</Text>
      </View>
      <View style={[styles.severityBadge, { backgroundColor: config.bg }]}>
        <Text style={[styles.severityText, { color: config.color }]}>
          {alert.severity === 'critical' ? 'Critique' : alert.severity === 'warning' ? 'Attention' : 'Info'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AlertsScreen() {
  const router = useRouter();
  const { t } = useLanguageStore();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params = filter === 'unread' ? { isRead: false } : filter === 'critical' ? { severity: 'critical' } : {};
      const res = await api.get('/alerts', { params });
      setAlerts(res.data.data);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { loadAlerts(); }, [filter]);

  const handleRead = async (id) => {
    try {
      await api.put(`/alerts/${id}/read`);
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isRead: true } : a));
    } catch (e) {}
  };

  const handleReadAll = async () => {
    try {
      await api.put('/alerts/read-all');
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    } catch (e) {}
  };

  const handleCheck = async () => {
    setLoading(true);
    try {
      const res = await api.post('/alerts/check');
      Alert.alert(t.common.success, res.data.message);
      loadAlerts();
    } catch (e) {
      Alert.alert(t.common.error, t.alerts.noAlerts);
    }
    setLoading(false);
  };

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const FILTERS = [
    { key: 'all', label: t.common.all },
    { key: 'unread', label: `${t.alerts.markRead}${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { key: 'critical', label: 'Critiques' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{t.alerts.title}</Text>
        <TouchableOpacity onPress={handleCheck} style={styles.checkBtn}>
          <Ionicons name="refresh-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.readAllBtn} onPress={handleReadAll}>
            <Text style={styles.readAllText}>{t.alerts.markAllRead}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AlertItem alert={item} onRead={handleRead} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAlerts} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>{t.alerts.noAlerts}</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={handleCheck}>
                <Text style={styles.emptyBtnText}>Vérifier maintenant</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingTop: 56, paddingBottom: SPACING.lg
  },
  backBtn: { padding: 4 },
  title: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  checkBtn: { padding: 4 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: SPACING.sm, alignItems: 'center'
  },
  filterBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: RADIUS.full, backgroundColor: COLORS.background
  },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  filterTextActive: { color: COLORS.white },
  readAllBtn: { marginLeft: 'auto' },
  readAllText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  list: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  alertCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.white,
    borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  alertCardUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  alertIcon: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm
  },
  alertBody: { flex: 1 },
  alertTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  alertTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  alertMessage: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 18 },
  alertTime: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 4 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, marginLeft: SPACING.sm },
  severityText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary, fontWeight: '600' },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
  emptyBtnText: { color: COLORS.white, fontWeight: '700' }
});
