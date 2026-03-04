import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';

const APP_VERSION = '1.0.0';
const YEAR = new Date().getFullYear();

function InfoRow({ icon, label, value, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.infoRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.infoLeft}>
        <View style={[styles.infoIcon, { backgroundColor: `${COLORS.primary}12` }]}>
          <Ionicons name={icon} size={16} color={COLORS.primary} />
        </View>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={[styles.infoValue, onPress && { color: COLORS.primary }]}>{value}</Text>
        {onPress && <Ionicons name="open-outline" size={12} color={COLORS.primary} />}
      </View>
    </Wrapper>
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
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.logoBox}>
            <Ionicons name="swap-horizontal" size={40} color="#fff" />
          </View>
          <Text style={styles.appName}>KABRAK Exchange Pro</Text>
          <Text style={styles.appTagline}>Solution professionnelle de gestion{'\n'}de bureau de change</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{APP_VERSION}</Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Application</Text>
          <InfoRow icon="phone-portrait-outline" label="Version" value={APP_VERSION} />
          <InfoRow icon="logo-apple" label="Plateforme" value="iOS & Android" />
          <InfoRow icon="cloud-outline" label="Serveur" value="Railway (Cloud)" />
          <InfoRow icon="shield-checkmark-outline" label="Sécurité" value="JWT + HTTPS" />
        </View>

        {/* Features */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fonctionnalités</Text>
          {[
            { icon: 'people-outline', text: 'Gestion des clients et contacts' },
            { icon: 'swap-horizontal-outline', text: 'Transactions multi-devises (achat/vente)' },
            { icon: 'cash-outline', text: 'Paiements partiels et suivi des dettes' },
            { icon: 'wallet-outline', text: 'Commandes de dépôt avec code unique' },
            { icon: 'document-text-outline', text: 'Reçus PDF professionnels' },
            { icon: 'trending-up-outline', text: 'Taux de change en temps réel' },
            { icon: 'bar-chart-outline', text: 'Rapports et analyse de profit' },
            { icon: 'notifications-outline', text: 'Notifications push en temps réel' },
            { icon: 'people-circle-outline', text: 'Gestion d\'équipe (propriétaire / manager / employé)' },
            { icon: 'book-outline', text: 'Journal de caisse et clôture' },
            { icon: 'time-outline', text: 'Journal d\'audit complet' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: `${COLORS.primary}10` }]}>
                <Ionicons name={f.icon} size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Developer */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Développeur</Text>
          <InfoRow icon="business-outline" label="Entreprise" value="KABRAK ENG" />
          <InfoRow icon="globe-outline" label="Site web" value="kabrakeng.com" onPress={() => Linking.openURL('https://kabrakeng.com')} />
          <InfoRow icon="mail-outline" label="Support" value="support@kabrakeng.com" onPress={() => Linking.openURL('mailto:support@kabrakeng.com')} />
        </View>

        {/* Legal */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mentions légales</Text>
          <Text style={styles.legalText}>
            KABRAK Exchange Pro est une solution de gestion destinée aux bureaux de change. 
            Vos données sont stockées de manière sécurisée sur un serveur privé. 
            Aucune information personnelle n'est partagée avec des tiers.
          </Text>
          <View style={{ height: 8 }} />
          <Text style={styles.legalText}>
            En utilisant cette application, vous acceptez nos conditions d'utilisation 
            et notre politique de confidentialité.
          </Text>
        </View>

        <Text style={styles.footer}>© {YEAR} KABRAK ENG — Tous droits réservés</Text>
        <Text style={[styles.footer, { marginTop: 2, marginBottom: 40 }]}>Fait avec ❤️ au Cameroun</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingTop: 56, paddingBottom: SPACING.lg,
  },
  backBtn: { padding: 4 },
  title: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  heroSection: {
    alignItems: 'center', backgroundColor: COLORS.primary,
    paddingBottom: 32, paddingTop: SPACING.md,
  },
  logoBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  appName: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  appTagline: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6, textAlign: 'center', lineHeight: 18 },
  versionBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 4, marginTop: 10,
  },
  versionText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 10 },
  featureIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  featureText: { fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, flex: 1, lineHeight: 18 },
  legalText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 19 },
  footer: { textAlign: 'center', color: COLORS.textMuted, fontSize: 11, fontWeight: '600', marginTop: SPACING.lg },
});
