import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>À propos</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Ionicons name="swap-horizontal" size={52} color={COLORS.white} />
          </View>
          <Text style={styles.appName}>Exchange Manager</Text>
          <Text style={styles.appTagline}>Gestion de Bureau de Change</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <InfoRow label="Version" value="1.0.0" />
          <InfoRow label="Plateforme" value="iOS & Android" />
          <InfoRow label="Framework" value="React Native (Expo)" />
          <InfoRow label="Base de données" value="SQLite / PostgreSQL" />
          <InfoRow label="Authentification" value="JWT" />
        </View>

        {/* Features */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fonctionnalités</Text>
          {[
            { icon: 'people-outline', text: 'Gestion des clients' },
            { icon: 'swap-horizontal-outline', text: 'Transactions multi-devises' },
            { icon: 'cash-outline', text: 'Paiements partiels' },
            { icon: 'document-text-outline', text: 'Reçus PDF (WhatsApp / Email / Impression)' },
            { icon: 'book-outline', text: 'Journal de caisse' },
            { icon: 'bar-chart-outline', text: 'Rapports mensuels' },
            { icon: 'notifications-outline', text: 'Alertes intelligentes' },
            { icon: 'shield-checkmark-outline', text: 'Sécurité & Rôles (Admin/Employé)' },
            { icon: 'time-outline', text: 'Journal d\'audit complet' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Legal */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Légal</Text>
          <Text style={styles.legalText}>
            Cette application est destinée à la gestion interne des opérations de change. 
            Toutes les données sont stockées localement et/ou sur votre serveur privé.
            Aucune donnée n'est partagée avec des tiers.
          </Text>
        </View>

        <Text style={styles.footer}>© 2025 Exchange Manager — Tous droits réservés</Text>

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
  logoSection: {
    alignItems: 'center', backgroundColor: COLORS.primary,
    paddingBottom: SPACING.xl, paddingTop: SPACING.md
  },
  logoBox: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md
  },
  appName: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.white },
  appTagline: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  versionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 4, marginTop: SPACING.sm
  },
  versionText: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.divider
  },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: SPACING.sm },
  featureIcon: {
    width: 32, height: 32, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.infoLight, justifyContent: 'center', alignItems: 'center'
  },
  featureText: { fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, flex: 1 },
  legalText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },
  footer: { textAlign: 'center', color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: SPACING.lg }
});
