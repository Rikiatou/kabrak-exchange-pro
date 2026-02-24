import { useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, StatusBar, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import useDashboardStore from '../../src/store/dashboardStore';
import useLanguageStore from '../../src/store/languageStore';
import useAuthStore from '../../src/store/authStore';
import { formatCurrency, getInitials } from '../../src/utils/helpers';
import OwnerDashboardScreen from '../owner-dashboard';

const { width } = Dimensions.get('window');
const GREEN_DARK = '#071a12';
const GREEN_MID  = '#0a3d22';
const GREEN_MAIN = '#0B6E4F';
const GOLD       = '#e8a020';
const WHITE      = '#ffffff';

const STATUS_CFG = {
  paid:    { label: 'Paid',    color: GREEN_MAIN, bg: '#e6f4ef' },
  partial: { label: 'Partial', color: '#d97706',  bg: '#fef3c7' },
  unpaid:  { label: 'Unpaid',  color: '#dc2626',  bg: '#fee2e2' },
};

function MetricCard({ label, value, icon, accent, sub, onPress }) {
  return (
    <TouchableOpacity style={styles.metricCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.metricIconBox, { backgroundColor: `${accent}18` }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {sub ? <Text style={[styles.metricSub, { color: accent }]}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}

function DebtorRow({ client, onPress }) {
  const total = parseFloat(client.totalPaid || 0) + parseFloat(client.totalDebt || 0);
  const pct = total > 0 ? (parseFloat(client.totalPaid || 0) / total) * 100 : 0;
  return (
    <TouchableOpacity style={styles.debtorRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.debtorAvatar}>
        <Text style={styles.debtorInitials}>{getInitials(client.name)}</Text>
      </View>
      <View style={styles.debtorMid}>
        <Text style={styles.debtorName} numberOfLines={1}>{client.name}</Text>
        <View style={styles.debtorBar}>
          <View style={[styles.debtorBarFill, { width: `${Math.min(pct, 100)}%` }]} />
        </View>
      </View>
      <Text style={styles.debtorAmt}>{formatCurrency(client.totalDebt)}</Text>
    </TouchableOpacity>
  );
}

function BarChart({ data }) {
  if (!data || data.length === 0) return null;
  const W = width - 64;
  const H = 110;
  const PAD_L = 8;
  const PAD_B = 24;
  const chartH = H - PAD_B;
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const barW = Math.floor((W - PAD_L) / data.length) - 4;
  return (
    <Svg width={W} height={H}>
      <Line x1={PAD_L} y1={0} x2={PAD_L} y2={chartH} stroke="#e2e8f0" strokeWidth={1} />
      <Line x1={PAD_L} y1={chartH} x2={W} y2={chartH} stroke="#e2e8f0" strokeWidth={1} />
      {data.map((d, i) => {
        const barH = maxVal > 0 ? Math.max((d.count / maxVal) * chartH, d.count > 0 ? 4 : 0) : 0;
        const x = PAD_L + 4 + i * ((W - PAD_L) / data.length);
        const y = chartH - barH;
        const isToday = i === data.length - 1;
        return (
          <Svg key={d.day}>
            <Rect x={x} y={y} width={barW} height={barH} rx={3} fill={isToday ? GREEN_MAIN : '#b7e4d0'} />
            <SvgText x={x + barW / 2} y={H - 4} fontSize={8} fill="#94a3b8" textAnchor="middle">{d.label}</SvgText>
            {d.count > 0 && <SvgText x={x + barW / 2} y={y - 3} fontSize={8} fill={isToday ? GREEN_MAIN : '#64748b'} textAnchor="middle">{d.count}</SvgText>}
          </Svg>
        );
      })}
    </Svg>
  );
}

function TopCurrenciesChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const COLORS_LIST = [GREEN_MAIN, '#0369a1', '#7c3aed', '#d97706', '#dc2626', '#0891b2'];
  return (
    <View style={{ gap: 8 }}>
      {data.slice(0, 5).map((d, i) => (
        <View key={d.currency} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ width: 36, fontSize: 11, fontWeight: '700', color: COLORS_LIST[i % COLORS_LIST.length] }}>{d.currency}</Text>
          <View style={{ flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ width: `${(d.count / maxCount) * 100}%`, height: '100%', backgroundColor: COLORS_LIST[i % COLORS_LIST.length], borderRadius: 4 }} />
          </View>
          <Text style={{ width: 28, fontSize: 11, color: '#64748b', fontWeight: '600', textAlign: 'right' }}>{d.count}</Text>
        </View>
      ))}
    </View>
  );
}

function TxRow({ tx, onPress }) {
  const cfg = STATUS_CFG[tx.status] || STATUS_CFG.unpaid;
  return (
    <TouchableOpacity style={styles.txRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.txStatusDot, { backgroundColor: cfg.color }]} />
      <View style={styles.txMid}>
        <Text style={styles.txRef} numberOfLines={1}>{tx.reference}</Text>
        <Text style={styles.txClient} numberOfLines={1}>{tx.client?.name}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={styles.txAmt}>{formatCurrency(tx.amountTo, tx.currencyTo)}</Text>
        <View style={[styles.txBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.txBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { data, isLoading, fetchDashboard } = useDashboardStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';
  const isOwner = user?.teamRole === 'owner' || (isAdmin && !user?.teamRole);

  useEffect(() => { fetchDashboard(); }, []);
  const onRefresh = useCallback(() => { fetchDashboard(); }, []);

  const { t } = useLanguageStore();
  const s = data?.summary || {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.dashboard.goodMorning : hour < 18 ? t.dashboard.goodAfternoon : t.dashboard.goodEvening;

  // Owner/admin sees the enriched owner dashboard
  if (isOwner) return <OwnerDashboardScreen />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN_DARK} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={GREEN_MAIN} colors={[GREEN_MAIN]} />}
      >
        {/* Header — same bg as welcome/login */}
        <View style={styles.header}>
          <View style={styles.headerBlobTR} />
          <View style={styles.headerBlobBL} />

          {/* Logo row — same as welcome */}
          <View style={styles.logoRow}>
            <View style={styles.logoIconWrap}>
              <Ionicons name="swap-horizontal" size={18} color={GOLD} />
            </View>
            <Text style={styles.logoText}>
              KABRAK <Text style={styles.logoTextGold}>Exchange Pro</Text>
            </Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/search')}>
              <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/alerts')}>
              <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/(tabs)/more')}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <View style={styles.greetBlock}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.greetName}>{user?.name?.split(' ')[0]}</Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>

          {/* Hero outstanding card — admin only */}
          {isAdmin ? (
            <View style={styles.heroCard}>
              <View>
                <Text style={styles.heroLabel}>{t.dashboard.pendingDebt}</Text>
                <Text style={styles.heroAmount}>{formatCurrency(s.totalOutstanding || 0)}</Text>
                <View style={styles.heroBadge}>
                  <View style={styles.heroBadgeDot} />
                  <Text style={styles.heroBadgeText}>
                    {s.unpaidCount || 0} {t.common.unpaid} · {s.partialCount || 0} {t.common.partial}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.heroAction} onPress={() => router.push('/transactions/new')}>
                <Ionicons name="add" size={20} color={WHITE} />
                <Text style={styles.heroActionText}>{t.transactions.new}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.heroCard} onPress={() => router.push('/transactions/new')}>
              <View>
                <Text style={styles.heroLabel}>{t.dashboard.recentTransactions}</Text>
                <Text style={styles.heroAmount}>{s.totalTransactions || 0}</Text>
                <View style={styles.heroBadge}>
                  <View style={styles.heroBadgeDot} />
                  <Text style={styles.heroBadgeText}>{t.dashboard.todayTx}: {s.todayTransactions || 0}</Text>
                </View>
              </View>
              <View style={styles.heroAction}>
                <Ionicons name="add" size={20} color={WHITE} />
                <Text style={styles.heroActionText}>{t.transactions.new}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Metric cards */}
        <View style={styles.metricsRow}>
          <MetricCard label={t.tabs.transactions} value={s.totalTransactions || 0} icon="swap-horizontal" accent="#0B6E4F" onPress={() => router.push('/(tabs)/transactions')} />
          {isAdmin && <MetricCard label={t.common.unpaid} value={s.unpaidCount || 0} icon="alert-circle" accent="#dc2626" sub={s.unpaidCount > 0 ? '⚠' : null} onPress={() => router.push('/(tabs)/transactions?status=unpaid')} />}
          <MetricCard label={t.dashboard.todayTx} value={s.todayTransactions || 0} icon="today-outline" accent="#0369a1" onPress={() => router.push('/(tabs)/transactions')} />
          <MetricCard label={t.tabs.clients} value={s.totalClients || 0} icon="people-outline" accent="#7c3aed" onPress={() => router.push('/(tabs)/clients')} />
        </View>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          {[
            { icon: 'swap-horizontal', label: t.transactions.new, color: '#0B6E4F', route: '/transactions/new' },
            { icon: 'person-add-outline', label: t.clients.new, color: '#0369a1', route: '/clients/new' },
            { icon: 'wallet-outline', label: t.more.deposits, color: '#0369a1', route: '/deposits' },
            isAdmin && { icon: 'bar-chart-outline', label: t.more.reports, color: '#7c3aed', route: '/reports' },
          ].filter(Boolean).map((q) => (
            <TouchableOpacity key={q.label} style={styles.quickBtn} onPress={() => router.push(q.route)} activeOpacity={0.7}>
              <View style={[styles.quickIcon, { backgroundColor: `${q.color}12` }]}>
                <Ionicons name={q.icon} size={22} color={q.color} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top debtors */}
        {data?.debtorClients?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{t.dashboard.topDebtors}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/clients')}>
                <Text style={styles.seeAll}>{t.dashboard.seeAll} →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              {data.debtorClients.slice(0, 5).map((c, i) => (
                <View key={c.id}>
                  <DebtorRow client={c} onPress={() => router.push(`/clients/${c.id}`)} />
                  {i < Math.min(data.debtorClients.length, 5) - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Charts */}
        {data?.charts && (
          <View style={styles.chartsRow}>
            <View style={[styles.chartCard, { flex: 3 }]}>
              <Text style={styles.chartTitle}>Transactions — 7 jours</Text>
              <BarChart data={data.charts.dailyVolume} />
            </View>
            <View style={[styles.chartCard, { flex: 2 }]}>
              <Text style={styles.chartTitle}>Top devises</Text>
              <TopCurrenciesChart data={data.charts.topCurrencies} />
            </View>
          </View>
        )}

        {/* Recent transactions */}
        {data?.recentTransactions?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{t.dashboard.recentTransactions}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                <Text style={styles.seeAll}>{t.dashboard.seeAll} →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              {data.recentTransactions.map((tx, i) => (
                <View key={tx.id}>
                  <TxRow tx={tx} onPress={() => router.push(`/transactions/${tx.id}`)} />
                  {i < data.recentTransactions.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent deposit orders */}
        {data?.recentDepositOrders?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Dépôts récents</Text>
              <TouchableOpacity onPress={() => router.push('/deposits')}>
                <Text style={styles.seeAll}>{t.dashboard.seeAll} →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              {data.recentDepositOrders.map((order, i) => (
                <View key={order.id}>
                  <TouchableOpacity style={styles.txRow} onPress={() => router.push(`/deposits?orderId=${order.id}`)} activeOpacity={0.7}>
                    <View style={[styles.txStatusDot, { backgroundColor: order.status === 'completed' ? GREEN_MAIN : order.status === 'partial' ? '#d97706' : '#dc2626' }]} />
                    <View style={styles.txMid}>
                      <Text style={styles.txRef} numberOfLines={1}>{order.reference}</Text>
                      <Text style={styles.txClient} numberOfLines={1}>{order.clientName}</Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={styles.txAmt}>{formatCurrency(order.totalAmount, order.currency)}</Text>
                      <View style={[styles.txBadge, { backgroundColor: order.status === 'completed' ? '#e6f4ef' : order.status === 'partial' ? '#fef3c7' : '#fee2e2' }]}>
                        <Text style={[styles.txBadgeText, { color: order.status === 'completed' ? GREEN_MAIN : order.status === 'partial' ? '#d97706' : '#dc2626' }]}>
                          {order.status === 'completed' ? 'Complété' : order.status === 'partial' ? 'Partiel' : 'En attente'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  {i < data.recentDepositOrders.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty state */}
        {!isLoading && !data?.recentTransactions?.length && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="swap-horizontal-outline" size={36} color={GREEN_MAIN} />
            </View>
            <Text style={styles.emptyTitle}>{t.dashboard.noTransactions}</Text>
            <Text style={styles.emptyDesc}>{t.dashboard.noTransactionsDesc}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/transactions/new')}>
              <Text style={styles.emptyBtnText}>{t.dashboard.createExchange}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  header: {
    backgroundColor: GREEN_DARK, paddingBottom: 24, overflow: 'hidden',
  },
  headerBlobTR: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(11,110,79,0.18)', top: -70, right: -80,
  },
  headerBlobBL: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(11,110,79,0.10)', bottom: -40, left: -60,
  },

  logoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
  },
  logoIconWrap: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: 'rgba(232,160,32,0.15)',
    borderWidth: 1, borderColor: 'rgba(232,160,32,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { fontSize: 17, fontWeight: '800', color: WHITE, letterSpacing: -0.3 },
  logoTextGold: { color: GOLD },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center',
    marginLeft: 6,
  },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: GREEN_MAIN, justifyContent: 'center', alignItems: 'center',
    marginLeft: 6,
  },
  avatarText: { color: WHITE, fontWeight: '700', fontSize: 13 },

  greetBlock: { paddingHorizontal: 20, paddingBottom: 16 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  greetName: { fontSize: 22, fontWeight: '800', color: WHITE, letterSpacing: -0.4, marginBottom: 2 },
  headerDate: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },

  heroCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, marginHorizontal: 20, padding: 18,
  },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: '600', letterSpacing: 0.5 },
  heroAmount: { fontSize: 28, fontWeight: '800', color: WHITE, letterSpacing: -0.5 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD },
  heroBadgeText: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  heroAction: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: GREEN_MAIN, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: GREEN_MAIN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  heroActionText: { color: WHITE, fontWeight: '700', fontSize: 13 },

  metricsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  metricCard: {
    flex: 1, backgroundColor: WHITE, borderRadius: 12, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  metricIconBox: {
    width: 32, height: 32, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  metricLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2, fontWeight: '500' },
  metricSub: { fontSize: 9, fontWeight: '600', marginTop: 3 },

  quickRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  quickBtn: {
    flex: 1, alignItems: 'center', backgroundColor: WHITE, borderRadius: 12, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  quickIcon: { width: 44, height: 44, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', textAlign: 'center' },

  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', letterSpacing: -0.2 },
  seeAll: { fontSize: 12, color: GREEN_MAIN, fontWeight: '600' },
  card: {
    backgroundColor: WHITE, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 14 },

  debtorRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  debtorAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: GREEN_MAIN, justifyContent: 'center', alignItems: 'center',
  },
  debtorInitials: { color: WHITE, fontWeight: '700', fontSize: 14 },
  debtorMid: { flex: 1 },
  debtorName: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 },
  debtorBar: { height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' },
  debtorBarFill: { height: '100%', backgroundColor: GREEN_MAIN, borderRadius: 2 },
  debtorAmt: { fontSize: 13, fontWeight: '700', color: '#dc2626' },

  txRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  txStatusDot: { width: 8, height: 8, borderRadius: 4 },
  txMid: { flex: 1 },
  txRef: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  txClient: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmt: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  txBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  txBadgeText: { fontSize: 10, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#e6f4ef', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: {
    backgroundColor: GREEN_MAIN, borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 12,
    shadowColor: GREEN_MAIN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  emptyBtnText: { color: WHITE, fontWeight: '700', fontSize: 14 },

  chartsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  chartCard: {
    backgroundColor: WHITE, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  chartTitle: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
});
