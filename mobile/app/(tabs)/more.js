import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../src/store/authStore';
import useLanguageStore from '../../src/store/languageStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import { getInitials } from '../../src/utils/helpers';

function MenuItem({ icon, label, subtitle, onPress, color = COLORS.primary, danger = false }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: danger ? COLORS.dangerLight : `${color}18` }]}>
        <Ionicons name={icon} size={22} color={danger ? COLORS.danger : color} />
      </View>
      <View style={styles.menuInfo}>
        <Text style={[styles.menuLabel, danger && { color: COLORS.danger }]}>{label}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function MenuSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function MoreScreen() {
  const { user, logout } = useAuthStore();
  const { t } = useLanguageStore();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    Alert.alert(t.more.logout, t.settings.logoutConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.more.logout, style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(auth)/login');
      }}
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.more.title}</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileInitials}>{getInitials(user?.name)}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: isAdmin ? COLORS.infoLight : COLORS.successLight }]}>
            <Text style={[styles.roleText, { color: isAdmin ? COLORS.info : COLORS.success }]}>
              {isAdmin ? t.users.admin : t.users.operator}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings/profile')}>
          <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <MenuSection title={t.more.title}>
        <MenuItem icon="wallet-outline" label={t.more.deposits} onPress={() => router.push('/deposits')} color="#0369a1" />
        <MenuItem icon="notifications-outline" label={t.more.alerts} onPress={() => router.push('/alerts')} color={COLORS.danger} />
        {isAdmin && <MenuItem icon="book-outline" label={t.more.cashbook} onPress={() => router.push('/cashbook')} color={COLORS.warning} />}
        {isAdmin && <MenuItem icon="bar-chart-outline" label={t.more.reports} onPress={() => router.push('/reports')} color="#7b1fa2" />}
        {isAdmin && <MenuItem icon="document-text-outline" label={t.more.audit} onPress={() => router.push('/audit')} color={COLORS.secondary} />}
      </MenuSection>

      {isAdmin && (
        <MenuSection title={t.users.title}>
          <MenuItem icon="people-outline" label={t.more.users} onPress={() => router.push('/users')} color={COLORS.primary} />
          <MenuItem icon="cash-outline" label={t.currencies.title} onPress={() => router.push('/(tabs)/currencies')} color={COLORS.success} />
          <MenuItem icon="lock-closed-outline" label="Clôture de caisse" subtitle="Bilan journalier" onPress={() => router.push('/cashclose')} color="#d97706" />
          <MenuItem icon="cube-outline" label="Stock de devises" subtitle="Inventaire physique" onPress={() => router.push('/stock')} color="#0891b2" />
        </MenuSection>
      )}

      <MenuSection title={t.settings.title}>
        {isAdmin && <MenuItem icon="business-outline" label="Mon entreprise" subtitle="Nom, téléphone, adresse" onPress={() => router.push('/settings/business')} color={COLORS.primary} />}
        <MenuItem icon="lock-closed-outline" label={t.settings.changePassword} onPress={() => router.push('/settings/change-password')} color={COLORS.primary} />
        <MenuItem icon="information-circle-outline" label={t.settings.about} onPress={() => router.push('/settings/about')} color={COLORS.textSecondary} />
        <MenuItem icon="log-out-outline" label={t.more.logout} danger onPress={handleLogout} />
      </MenuSection>

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingTop: 56, paddingBottom: SPACING.lg
  },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.white },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg, marginTop: SPACING.lg, borderRadius: RADIUS.lg,
    padding: SPACING.md, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4
  },
  profileAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md
  },
  profileInitials: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.xl },
  profileInfo: { flex: 1 },
  profileName: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  profileEmail: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, marginTop: 4 },
  roleText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  section: { marginTop: SPACING.lg, paddingHorizontal: SPACING.lg },
  sectionTitle: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm },
  sectionCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider
  },
  menuIcon: { width: 40, height: 40, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary },
  menuSubtitle: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 }
});
