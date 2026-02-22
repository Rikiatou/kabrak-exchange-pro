import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import useClientStore from '../../src/store/clientStore';
import useAuthStore from '../../src/store/authStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useLanguageStore from '../../src/store/languageStore';
import { formatCurrency } from '../../src/utils/helpers';

export default function ReportsScreen() {
  const router = useRouter();
  const { t } = useLanguageStore();
  const { clients, fetchClients } = useClientStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user && user.role !== 'admin') { router.back(); }
  }, [user]);
  useEffect(() => { fetchClients(); }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/monthly', { params: { year: selectedYear, month: selectedMonth } });
      setReport(res.data.data);
    } catch (e) {
      Alert.alert(t.common.error, e.response?.data?.message || t.reports.noData);
    }
    setLoading(false);
  };

  useEffect(() => { loadReport(); }, [selectedMonth, selectedYear]);

  const { language } = useLanguageStore();
  const monthLabels = language === 'fr'
    ? ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
    : ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{t.reports.title}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month Selector */}
        <View style={styles.selectorCard}>
          <View style={styles.yearRow}>
            <TouchableOpacity onPress={() => setSelectedYear(y => y - 1)}>
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.yearText}>{selectedYear}</Text>
            <TouchableOpacity onPress={() => setSelectedYear(y => y + 1)}>
              <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
            {monthLabels.map((m, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.monthChip, selectedMonth === i + 1 && styles.monthChipActive]}
                onPress={() => setSelectedMonth(i + 1)}
              >
                <Text style={[styles.monthChipText, selectedMonth === i + 1 && styles.monthChipTextActive]}>
                  {m.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : report ? (
          <>
            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>{t.reports.monthly} — {monthLabels[selectedMonth - 1]} {selectedYear}</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{report.summary.totalTransactions}</Text>
                  <Text style={styles.summaryLabel}>{t.reports.totalTransactions}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
                    {formatCurrency(report.summary.totalTransactionAmount)}
                  </Text>
                  <Text style={styles.summaryLabel}>{t.reports.totalVolume}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                    {formatCurrency(report.summary.totalPaymentsReceived)}
                  </Text>
                  <Text style={styles.summaryLabel}>{t.common.paid}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
                    {formatCurrency(report.summary.totalOutstanding)}
                  </Text>
                  <Text style={styles.summaryLabel}>{t.dashboard.pendingDebt}</Text>
                </View>
              </View>
            </View>

            {/* By Currency */}
            {Object.keys(report.byCurrency).length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t.reports.byCurrency}</Text>
                {Object.entries(report.byCurrency).map(([code, data]) => (
                  <View key={code} style={styles.currencyRow}>
                    <View style={styles.currencyCode}>
                      <Text style={styles.currencyCodeText}>{code}</Text>
                    </View>
                    <View style={styles.currencyData}>
                      <Text style={styles.currencyTotal}>{formatCurrency(data.total, code)}</Text>
                      <Text style={styles.currencyCount}>{data.count} {t.tabs.transactions}</Text>
                    </View>
                    <View style={styles.currencyPaid}>
                      <Text style={[styles.currencyTotal, { color: COLORS.success }]}>{formatCurrency(data.paid, code)}</Text>
                      <Text style={styles.currencyCount}>{t.common.paid}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Client Statements */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t.reports.topClients}</Text>
              {clients.slice(0, 10).map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.clientRow}
                  onPress={() => router.push(`/reports/client/${c.id}`)}
                >
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>{c.name[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{c.name}</Text>
                    {parseFloat(c.totalDebt) > 0 && (
                      <Text style={styles.clientDebt}>{t.dashboard.owes}: {formatCurrency(c.totalDebt)}</Text>
                    )}
                  </View>
                  <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
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
  selectorCard: {
    backgroundColor: COLORS.white, margin: SPACING.lg, borderRadius: RADIUS.lg,
    padding: SPACING.md, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.lg, marginBottom: SPACING.sm },
  yearText: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.textPrimary },
  monthScroll: { marginTop: 4 },
  monthChip: {
    paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.border, marginRight: SPACING.sm
  },
  monthChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  monthChipText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  monthChipTextActive: { color: COLORS.white },
  summaryCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  summaryItem: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.background,
    borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center'
  },
  summaryValue: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  summaryLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  currencyRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider
  },
  currencyCode: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm
  },
  currencyCodeText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.xs },
  currencyData: { flex: 1 },
  currencyTotal: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary },
  currencyCount: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  currencyPaid: { alignItems: 'flex-end' },
  clientRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider
  },
  clientAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm
  },
  clientAvatarText: { color: COLORS.white, fontWeight: '700' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  clientDebt: { fontSize: FONTS.sizes.xs, color: COLORS.danger, marginTop: 2 }
});
