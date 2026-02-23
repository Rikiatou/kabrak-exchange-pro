import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import useLicenseStore from '../../src/store/licenseStore';
import useLanguageStore from '../../src/store/languageStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';

const planLabels = { trial: 'Essai Gratuit', basic: 'Basic', pro: 'Pro', premium: 'Premium' };
const planColors = { trial: '#6366f1', basic: COLORS.primary, pro: '#0369a1', premium: '#d97706' };
const planIcons = { trial: 'time-outline', basic: 'shield-checkmark-outline', pro: 'diamond-outline', premium: 'trophy-outline' };

function InfoRow({ icon, label, value, color }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={18} color={COLORS.textSecondary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, color && { color }]}>{value}</Text>
    </View>
  );
}

export default function LicenseScreen() {
  const router = useRouter();
  const { language: lang } = useLanguageStore();
  const { licenseKey, licenseData, isValid, isChecking, checkOnline, clearLicense } = useLicenseStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (licenseKey) {
      checkOnline();
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkOnline();
    setRefreshing(false);
  };

  const handleChangeLicense = () => {
    Alert.alert(
      lang === 'fr' ? 'Changer de licence' : 'Change License',
      lang === 'fr' ? 'Voulez-vous déconnecter cette licence ? Vous devrez entrer une nouvelle clé.' : 'Do you want to disconnect this license? You will need to enter a new key.',
      [
        { text: lang === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        { text: lang === 'fr' ? 'Déconnecter' : 'Disconnect', style: 'destructive', onPress: async () => {
          await clearLicense();
          router.replace('/(auth)/license');
        }}
      ]
    );
  };

  const plan = licenseData?.plan || 'basic';
  const color = planColors[plan] || COLORS.primary;
  const daysLeft = licenseData?.daysLeft || 0;
  const expiresAt = licenseData?.expiresAt ? new Date(licenseData.expiresAt) : null;

  const getDaysColor = () => {
    if (daysLeft <= 3) return COLORS.danger;
    if (daysLeft <= 7) return COLORS.warning;
    return COLORS.success;
  };

  const getStatusText = () => {
    if (!licenseKey) return lang === 'fr' ? 'Aucune licence' : 'No license';
    if (!isValid) return lang === 'fr' ? 'Expirée' : 'Expired';
    return lang === 'fr' ? 'Active' : 'Active';
  };

  const getStatusColor = () => {
    if (!licenseKey || !isValid) return COLORS.danger;
    return COLORS.success;
  };

  if (isChecking && !licenseData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: SPACING.md }}>
          {lang === 'fr' ? 'Vérification de la licence...' : 'Checking license...'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{lang === 'fr' ? 'Ma Licence' : 'My License'}</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
          {refreshing ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="refresh-outline" size={22} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* License Card */}
      <View style={[styles.licenseCard, { borderLeftColor: color }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.planBadge, { backgroundColor: `${color}18` }]}>
            <Ionicons name={planIcons[plan] || 'shield-outline'} size={20} color={color} />
            <Text style={[styles.planText, { color }]}>{planLabels[plan] || plan.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
          </View>
        </View>

        {licenseKey && (
          <View style={styles.keyContainer}>
            <Text style={styles.keyLabel}>{lang === 'fr' ? 'Clé de licence' : 'License Key'}</Text>
            <Text style={styles.keyValue}>{licenseKey}</Text>
          </View>
        )}

        {licenseData?.businessName && (
          <View style={styles.businessContainer}>
            <Ionicons name="business-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.businessName}>{licenseData.businessName}</Text>
          </View>
        )}
      </View>

      {/* Days Left */}
      {isValid && daysLeft > 0 && (
        <View style={styles.daysCard}>
          <View style={styles.daysCircle}>
            <Text style={[styles.daysNumber, { color: getDaysColor() }]}>{daysLeft}</Text>
            <Text style={styles.daysLabel}>{lang === 'fr' ? 'jours' : 'days'}</Text>
          </View>
          <View style={styles.daysInfo}>
            <Text style={styles.daysTitle}>
              {lang === 'fr' ? 'Jours restants' : 'Days remaining'}
            </Text>
            {expiresAt && (
              <Text style={styles.daysExpiry}>
                {lang === 'fr' ? 'Expire le' : 'Expires on'} {expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            )}
            {daysLeft <= 7 && (
              <Text style={[styles.daysWarning, { color: getDaysColor() }]}>
                {lang === 'fr' ? '⚠️ Pensez à renouveler votre licence' : '⚠️ Consider renewing your license'}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>{lang === 'fr' ? 'Détails' : 'Details'}</Text>
        <InfoRow
          icon="shield-checkmark-outline"
          label={lang === 'fr' ? 'Plan' : 'Plan'}
          value={planLabels[plan] || plan}
          color={color}
        />
        <InfoRow
          icon="pulse-outline"
          label={lang === 'fr' ? 'Statut' : 'Status'}
          value={getStatusText()}
          color={getStatusColor()}
        />
        {licenseData?.startsAt && (
          <InfoRow
            icon="calendar-outline"
            label={lang === 'fr' ? 'Début' : 'Start'}
            value={new Date(licenseData.startsAt).toLocaleDateString('fr-FR')}
          />
        )}
        {expiresAt && (
          <InfoRow
            icon="time-outline"
            label={lang === 'fr' ? 'Expiration' : 'Expiration'}
            value={expiresAt.toLocaleDateString('fr-FR')}
            color={daysLeft <= 7 ? getDaysColor() : undefined}
          />
        )}
        {licenseData?.ownerName && (
          <InfoRow
            icon="person-outline"
            label={lang === 'fr' ? 'Propriétaire' : 'Owner'}
            value={licenseData.ownerName}
          />
        )}
        {licenseData?.ownerEmail && (
          <InfoRow
            icon="mail-outline"
            label="Email"
            value={licenseData.ownerEmail}
          />
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsCard}>
        {(!isValid || daysLeft <= 14) && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
            onPress={() => router.push('/(auth)/payment')}
          >
            <Ionicons name="card-outline" size={20} color={COLORS.white} />
            <Text style={styles.actionBtnText}>
              {lang === 'fr' ? 'Renouveler ma licence' : 'Renew my license'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnOutline]}
          onPress={handleChangeLicense}
        >
          <Ionicons name="swap-horizontal-outline" size={20} color={COLORS.danger} />
          <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>
            {lang === 'fr' ? 'Changer de licence' : 'Change license'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingTop: 56, paddingBottom: SPACING.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.white },
  refreshBtn: { padding: 4 },
  licenseCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.lg,
    borderRadius: RADIUS.lg, padding: SPACING.lg, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: RADIUS.full, gap: 6
  },
  planText: { fontSize: FONTS.sizes.md, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: RADIUS.full, gap: 6
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  keyContainer: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.divider },
  keyLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  keyValue: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary, marginTop: 4, fontFamily: 'monospace' },
  businessContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.sm },
  businessName: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  daysCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: RADIUS.lg, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  daysCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.lg
  },
  daysNumber: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  daysLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  daysInfo: { flex: 1 },
  daysTitle: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary },
  daysExpiry: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  daysWarning: { fontSize: FONTS.sizes.sm, fontWeight: '600', marginTop: 6 },
  detailsCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  detailsTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.divider
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  actionsCard: {
    marginHorizontal: SPACING.lg, marginTop: SPACING.lg, gap: SPACING.sm
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: RADIUS.lg, gap: 8
  },
  actionBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.white },
  actionBtnOutline: {
    backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.danger
  }
});
