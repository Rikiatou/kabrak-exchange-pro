import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import useAuthStore from '../src/store/authStore';
import useDashboardStore from '../src/store/dashboardStore';
import useReportStore from '../src/store/reportStore';
import useCurrencyStore from '../src/store/currencyStore';
import useLanguageStore from '../src/store/languageStore';
import { formatCurrency, getInitials } from '../src/utils/helpers';
import api from '../src/services/api';

const { width } = Dimensions.get('window');
const GREEN_DARK = '#071a12';
const GREEN_MID = '#0a3d22';
const GREEN_MAIN = '#0B6E4F';
const GOLD = '#e8a020';
const WHITE = '#ffffff';

function ProfitChart({ data }) {
  if (!data || data.length === 0) return null;
  const W = width - 64;
  const H = 130;
  const PAD_L = 8;
  const PAD_B = 24;
  const chartH = H - PAD_B;
  const maxVal = Math.max(...data.map(d => Math.abs(d.profit)), 1);
  const barW = Math.max(Math.floor((W - PAD_L) / data.length) - 6, 12);
  return (
    <Svg width={W} height={H}>
      <Line x1={PAD_L} y1={chartH} x2={W} y2={chartH} stroke="#e2e8f0" strokeWidth={1} />
      {data.map((d, i) => {
        const barH = Math.max((Math.abs(d.profit) / maxVal) * chartH, d.profit !== 0 ? 4 : 0);
        const x = PAD_L + 4 + i * ((W - PAD_L) / data.length);
        const isPositive = d.profit >= 0;
        const y = isPositive ? chartH - barH : chartH;
        return (
          <Svg key={d.date || i}>
            <Rect x={x} y={isPositive ? y : chartH} width={barW} height={barH} rx={3} fill={isPositive ? GREEN_MAIN : '#ef4444'} opacity={0.85} />
            <SvgText x={x + barW / 2} y={H - 4} fontSize={8} fill="#94a3b8" textAnchor="middle">{d.label}</SvgText>
            {d.profit !== 0 && (
              <SvgText x={x + barW / 2} y={isPositive ? y - 4 : chartH + barH + 10} fontSize={8} fill={isPositive ? GREEN_MAIN : '#ef4444'} textAnchor="middle">
                {Math.round(d.profit).toLocaleString('fr-FR')}
              </SvgText>
            )}
          </Svg>
        );
      })}
    </Svg>
  );
}

function StatCard({ icon, label, value, sub, color, onPress }) {
  return (
    <TouchableOpacity style={s.statCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.statIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub ? <Text style={[s.statSub, { color }]}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}

function AlertRow({ alert }) {
  const sevColors = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
  const c = sevColors[alert.severity] || sevColors.info;
  return (
    <View style={s.alertRow}>
      <View style={[s.alertDot, { backgroundColor: c }]} />
      <View style={{ flex: 1 }}>
        <Text style={s.alertTitle} numberOfLines={1}>{alert.title}</Text>
        <Text style={s.alertMsg} numberOfLines={2}>{alert.message}</Text>
      </View>
      <Text style={s.alertTime}>
        {new Date(alert.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
      </Text>
    </View>
  );
}

function StockRow({ currency }) {
  const stock = parseFloat(currency.stockAmount || 0);
  const low = parseFloat(currency.lowStockAlert || 0);
  const isLow = low > 0 && stock <= low;
  return (
    <View style={s.stockRow}>
      <View style={[s.stockBadge, isLow && { backgroundColor: '#fef2f2' }]}>
        <Text style={[s.stockCode, isLow && { color: '#ef4444' }]}>{currency.code}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.stockName} numberOfLines={1}>{currency.name}</Text>
        <Text style={s.stockRate}>Achat: {currency.buyRate} · Vente: {currency.sellRate}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[s.stockAmt, isLow && { color: '#ef4444' }]}>
          {stock.toLocaleString('fr-FR')} {currency.symbol}
        </Text>
        {isLow && <Text style={s.stockLowBadge}>⚠ Stock bas</Text>}
      </View>
    </View>
  );
}

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: dashData, fetchDashboard, isLoading: dashLoading } = useDashboardStore();
  const { profitData, fetchProfitReport, isLoading: profitLoading } = useReportStore();
  const { currencies, fetchCurrencies } = useCurrencyStore();
  const { t } = useLanguageStore();

  const [alerts, setAlerts] = useState([]);
  const [team, setTeam] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    await Promise.all([
      fetchDashboard(),
      fetchProfitReport({ period }),
      fetchCurrencies(),
      api.get('/alerts?limit=5').then(r => setAlerts(r.data.data || [])).catch(() => {}),
      api.get('/team').then(r => setTeam(r.data.data || [])).catch(() => {}),
    ]);
  }, [period]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const changePeriod = (p) => {
    setPeriod(p);
    fetchProfitReport({ period: p });
  };

  const summary = dashData?.summary || {};
  const profit = profitData?.summary || {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <View style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_MAIN} colors={[GREEN_MAIN]} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerBlobTR} />
          <View style={s.headerBlobBL} />

          <View style={s.logoRow}>
            <View style={s.logoIconWrap}>
              <Ionicons name="swap-horizontal" size={18} color={GOLD} />
            </View>
            <Text style={s.logoText}>KABRAK <Text style={{ color: GOLD }}>Exchange Pro</Text></Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={s.headerIconBtn} onPress={() => router.push('/alerts')}>
              <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.7)" />
              {alerts.length > 0 && <View style={s.notifDot} />}
            </TouchableOpacity>
            <TouchableOpacity style={s.avatarBtn} onPress={() => router.push('/(tabs)/more')}>
              <Text style={s.avatarText}>{getInitials(user?.name)}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.greetBlock}>
            <Text style={s.greeting}>{greeting},</Text>
            <Text style={s.greetName}>{user?.name?.split(' ')[0]}</Text>
            <Text style={s.headerDate}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>

          {/* Profit Hero Card */}
          <View style={s.heroCard}>
            <View>
              <Text style={s.heroLabel}>PROFIT TOTAL ({period === 'daily' ? "Aujourd'hui" : period === 'weekly' ? 'Cette semaine' : 'Ce mois'})</Text>
              <Text style={[s.heroAmount, { color: (profit.totalProfit || 0) >= 0 ? '#10b981' : '#ef4444' }]}>
                {(profit.totalProfit || 0) >= 0 ? '+' : ''}{formatCurrency(profit.totalProfit || 0)}
              </Text>
              <View style={s.heroBadge}>
                <Ionicons
                  name={profit.profitChange >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={profit.profitChange >= 0 ? '#10b981' : '#ef4444'}
                />
                <Text style={[s.heroBadgeText, { color: profit.profitChange >= 0 ? '#10b981' : '#ef4444' }]}>
                  {profit.profitChange >= 0 ? '+' : ''}{Math.round(profit.profitChange || 0)}% vs période précédente
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={s.heroStat}>{profit.totalTransactions || 0} tx</Text>
              <Text style={s.heroStatSub}>{profit.profitableCount || 0} ✓ · {profit.lossCount || 0} ✗</Text>
            </View>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={s.quickRow}>
          {[
            { icon: 'swap-horizontal', label: 'Nouvelle Tx', color: GREEN_MAIN, route: '/transactions/new' },
            { icon: 'person-add-outline', label: 'Nouveau client', color: '#0369a1', route: '/clients/new' },
            { icon: 'wallet-outline', label: 'Dépôts', color: '#0369a1', route: '/deposits' },
            { icon: 'images-outline', label: 'Galerie reçus', color: '#0891b2', route: '/receipts' },
            { icon: 'bar-chart-outline', label: 'Rapports', color: '#7c3aed', route: '/reports' },
          ].map((q) => (
            <TouchableOpacity key={q.label} style={s.quickBtn} onPress={() => router.push(q.route)} activeOpacity={0.7}>
              <View style={[s.quickIcon, { backgroundColor: `${q.color}15` }]}>
                <Ionicons name={q.icon} size={22} color={q.color} />
              </View>
              <Text style={s.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period Selector */}
        <View style={s.periodRow}>
          {['daily', 'weekly', 'monthly'].map(p => (
            <TouchableOpacity
              key={p}
              style={[s.periodBtn, period === p && s.periodBtnActive]}
              onPress={() => changePeriod(p)}
            >
              <Text style={[s.periodText, period === p && s.periodTextActive]}>
                {p === 'daily' ? 'Jour' : p === 'weekly' ? 'Semaine' : 'Mois'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={s.metricsRow}>
          <StatCard icon="cash-outline" label="Profit moyen/tx" value={formatCurrency(profit.avgProfitPerTransaction || 0)} color={GREEN_MAIN} onPress={() => router.push('/reports')} />
          <StatCard icon="alert-circle-outline" label="Impayés (MPA)" value={summary.unpaidCount || 0} sub={summary.unpaidCount > 0 ? '⚠' : null} color="#dc2626" onPress={() => router.push('/(tabs)/transactions?status=unpaid')} />
          <StatCard icon="today-outline" label="Tx aujourd'hui" value={summary.todayTransactions || 0} color="#0369a1" onPress={() => { const today = new Date().toISOString().split('T')[0]; router.push(`/(tabs)/transactions?dateFrom=${today}&dateTo=${today}`); }} />
        </View>
        <View style={s.metricsRow}>
          <StatCard icon="wallet-outline" label="Encaissé (mois)" value={formatCurrency(summary.monthPayments || 0)} color="#7c3aed" onPress={() => router.push('/cashbook')} />
          <StatCard icon="people-outline" label="Équipe" value={team.length} color="#0891b2" onPress={() => router.push('/settings/team')} />
          <StatCard icon="shield-checkmark-outline" label="Dette totale" value={formatCurrency(summary.totalOutstanding || 0)} color="#d97706" onPress={() => router.push('/(tabs)/clients')} />
        </View>

        {/* Profit Chart */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>📊 Évolution du profit</Text>
            <TouchableOpacity onPress={() => router.push('/reports')}>
              <Text style={s.seeAll}>Rapport complet →</Text>
            </TouchableOpacity>
          </View>
          <View style={s.card}>
            <View style={{ padding: 14 }}>
              {profitData?.dailyData?.length > 0 ? (
                <ProfitChart data={profitData.dailyData} />
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Ionicons name="bar-chart-outline" size={32} color="#cbd5e1" />
                  <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Aucune donnée pour cette période</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Profit by Currency Pair */}
        {profitData?.byCurrencyPair?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>💱 Profit par paire de devises</Text>
            <View style={s.card}>
              {profitData.byCurrencyPair.slice(0, 6).map((pair, i) => (
                <View key={pair.pair}>
                  <View style={s.pairRow}>
                    <View style={s.pairBadge}>
                      <Text style={s.pairCode}>{pair.pair}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.pairCount}>{pair.count} transactions</Text>
                      <Text style={s.pairVol}>Vol: {pair.volume.toLocaleString('fr-FR')}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[s.pairProfit, { color: pair.profit >= 0 ? GREEN_MAIN : '#ef4444' }]}>
                        {pair.profit >= 0 ? '+' : ''}{pair.profit.toLocaleString('fr-FR')}
                      </Text>
                      <Text style={s.pairMargin}>Moy: {pair.avgMargin.toLocaleString('fr-FR')}/tx</Text>
                    </View>
                  </View>
                  {i < profitData.byCurrencyPair.length - 1 && <View style={s.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Stock Overview */}
        {currencies?.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>🏦 Stock de devises</Text>
              <TouchableOpacity onPress={() => router.push('/stock')}>
                <Text style={s.seeAll}>Voir tout →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.card}>
              {currencies.slice(0, 6).map((c, i) => (
                <View key={c.id}>
                  <StockRow currency={c} />
                  {i < Math.min(currencies.length, 6) - 1 && <View style={s.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Team Activity */}
        {team.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>👥 Équipe</Text>
              <TouchableOpacity onPress={() => router.push('/settings/team')}>
                <Text style={s.seeAll}>Gérer →</Text>
              </TouchableOpacity>
            </View>
            <View style={s.card}>
              {team.slice(0, 5).map((m, i) => (
                <View key={m.id}>
                  <TouchableOpacity style={s.teamRow} onPress={() => router.push('/settings/team')} activeOpacity={0.7}>
                    <View style={[s.teamAvatar, { backgroundColor: m.teamRole === 'owner' ? '#6366f1' : m.teamRole === 'manager' ? '#0369a1' : GREEN_MAIN }]}>
                      <Text style={s.teamInitials}>{(m.firstName || m.name || '?')[0].toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.teamName}>{m.firstName || m.name} {m.lastName || ''}</Text>
                      <Text style={s.teamRole}>{m.teamRole === 'owner' ? 'Propriétaire' : m.teamRole === 'manager' ? 'Manager' : 'Caissier'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={[s.onlineDot, { backgroundColor: m.lastLogin && (Date.now() - new Date(m.lastLogin).getTime()) < 86400000 ? '#10b981' : '#94a3b8' }]} />
                      {m.lastLogin && (
                        <Text style={s.teamLastLogin}>
                          {new Date(m.lastLogin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  {i < Math.min(team.length, 5) - 1 && <View style={s.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Alerts */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>🔔 Alertes récentes</Text>
            <TouchableOpacity onPress={() => router.push('/alerts')}>
              <Text style={s.seeAll}>Tout voir →</Text>
            </TouchableOpacity>
          </View>
          <View style={s.card}>
            {alerts.length > 0 ? (
              alerts.slice(0, 5).map((a, i) => (
                <View key={a.id}>
                  <TouchableOpacity onPress={() => router.push('/alerts')} activeOpacity={0.7}>
                    <AlertRow alert={a} />
                  </TouchableOpacity>
                  {i < Math.min(alerts.length, 5) - 1 && <View style={s.divider} />}
                </View>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>Aucune alerte récente</Text>
              </View>
            )}
          </View>
        </View>


        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  header: { backgroundColor: GREEN_DARK, paddingBottom: 24, overflow: 'hidden' },
  headerBlobTR: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(11,110,79,0.18)', top: -70, right: -80 },
  headerBlobBL: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(11,110,79,0.10)', bottom: -40, left: -60 },

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  logoIconWrap: { width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(232,160,32,0.15)', borderWidth: 1, borderColor: 'rgba(232,160,32,0.3)', justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 17, fontWeight: '800', color: WHITE, letterSpacing: -0.3 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  avatarBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: GREEN_MAIN, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  avatarText: { color: WHITE, fontWeight: '700', fontSize: 13 },

  greetBlock: { paddingHorizontal: 20, paddingBottom: 16 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  greetName: { fontSize: 22, fontWeight: '800', color: WHITE, letterSpacing: -0.4, marginBottom: 2 },
  headerDate: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },

  heroCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 16, marginHorizontal: 20, padding: 18 },
  heroLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 4, fontWeight: '700', letterSpacing: 0.8 },
  heroAmount: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  heroBadgeText: { fontSize: 11, fontWeight: '600' },
  heroStat: { fontSize: 16, fontWeight: '800', color: WHITE },
  heroStatSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },

  periodRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: WHITE, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  periodBtnActive: { backgroundColor: GREEN_MAIN, borderColor: GREEN_MAIN },
  periodText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  periodTextActive: { color: WHITE },

  metricsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  statCard: { flex: 1, backgroundColor: WHITE, borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  statLabel: { fontSize: 9, color: '#94a3b8', marginTop: 2, fontWeight: '500' },
  statSub: { fontSize: 9, fontWeight: '600', marginTop: 3 },

  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', letterSpacing: -0.2, marginBottom: 10 },
  seeAll: { fontSize: 12, color: GREEN_MAIN, fontWeight: '600' },
  card: { backgroundColor: WHITE, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 14 },

  pairRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  pairBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pairCode: { fontSize: 12, fontWeight: '800', color: GREEN_MAIN },
  pairCount: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  pairVol: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  pairProfit: { fontSize: 14, fontWeight: '800' },
  pairMargin: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  stockRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  stockBadge: { backgroundColor: '#f0fdf4', width: 48, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stockCode: { fontSize: 12, fontWeight: '800', color: GREEN_MAIN },
  stockName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  stockRate: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  stockAmt: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  stockLowBadge: { fontSize: 9, color: '#ef4444', fontWeight: '700', marginTop: 2 },

  teamRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  teamAvatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  teamInitials: { color: WHITE, fontWeight: '700', fontSize: 14 },
  teamName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  teamRole: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  teamLastLogin: { fontSize: 10, color: '#94a3b8' },

  alertRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  alertDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  alertTitle: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  alertMsg: { fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 16 },
  alertTime: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 16, gap: 8, justifyContent: 'flex-start' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: { width: (width - 56) / 4, alignItems: 'center', backgroundColor: WHITE, borderRadius: 12, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  quickIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickLabel: { fontSize: 9, color: '#64748b', fontWeight: '600', textAlign: 'center' },
});
