import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../src/constants/colors';
import useAuthStore from '../../src/store/authStore';
import api from '../../src/services/api';

const RED = '#dc2626';
const ORANGE = '#ea580c';
const GREEN = '#0B6E4F';

const OPTIONS = [
  {
    key: 'transactions',
    icon: 'swap-horizontal-outline',
    color: ORANGE,
    title: 'Supprimer les transactions',
    description: 'Supprime toutes les transactions et paiements. Les clients sont conservés.',
    endpoint: '/reset/transactions',
    confirm: 'Supprimer TOUTES les transactions et paiements ?\n\nCette action est irréversible.',
    danger: false,
  },
  {
    key: 'deposits',
    icon: 'wallet-outline',
    color: '#7c3aed',
    title: 'Supprimer les dépôts',
    description: 'Supprime toutes les commandes et versements de dépôt.',
    endpoint: '/reset/deposits',
    confirm: 'Supprimer TOUS les dépôts ?\n\nCette action est irréversible.',
    danger: false,
  },
  {
    key: 'clients',
    icon: 'people-outline',
    color: '#0369a1',
    title: 'Supprimer les clients',
    description: 'Supprime tous les clients ainsi que leurs transactions et dépôts associés.',
    endpoint: '/reset/clients',
    confirm: 'Supprimer TOUS les clients et leurs données (transactions, dépôts) ?\n\nCette action est irréversible.',
    danger: false,
  },
  {
    key: 'all',
    icon: 'nuclear-outline',
    color: RED,
    title: 'Tout réinitialiser',
    description: 'Supprime TOUTES les données opérationnelles : transactions, clients, dépôts, journal de caisse. Vos paramètres et devises sont conservés.',
    endpoint: '/reset/all',
    confirm: 'ATTENTION — Réinitialisation complète\n\nCela supprimera définitivement :\n• Toutes les transactions\n• Tous les clients\n• Tous les dépôts\n• Le journal de caisse\n\nVos paramètres et devises seront conservés.\n\nÊtes-vous absolument sûr ?',
    danger: true,
  },
];

function ResetOption({ option, onPress, loading }) {
  return (
    <TouchableOpacity
      style={[styles.option, option.danger && styles.optionDanger]}
      onPress={() => onPress(option)}
      activeOpacity={0.7}
      disabled={loading}
    >
      <View style={[styles.optionIcon, { backgroundColor: `${option.color}15` }]}>
        <Ionicons name={option.icon} size={22} color={option.color} />
      </View>
      <View style={styles.optionContent}>
        <Text style={[styles.optionTitle, { color: option.color }]}>{option.title}</Text>
        <Text style={styles.optionDesc}>{option.description}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={option.color} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      )}
    </TouchableOpacity>
  );
}

export default function ResetDataScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loadingKey, setLoadingKey] = useState(null);
  const isOwner = user?.teamRole === 'owner';

  if (!isOwner) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Réinitialisation</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={48} color="#94a3b8" />
          <Text style={styles.accessDeniedText}>Accès réservé au propriétaire</Text>
        </View>
      </View>
    );
  }

  const doReset = async (option) => {
    setLoadingKey(option.key);
    try {
      const res = await api.post(option.endpoint);
      if (res.data.success) {
        Alert.alert('✅ Succès', 'Les données ont été supprimées avec succès.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/dashboard') },
        ]);
      } else {
        Alert.alert('Erreur', res.data.message || 'Une erreur est survenue.');
      }
    } catch (err) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Impossible de réinitialiser les données.');
    } finally {
      setLoadingKey(null);
    }
  };

  const handleReset = (option) => {
    Alert.alert(
      '⚠️ Confirmation',
      option.confirm,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: option.danger ? '🗑️ Tout supprimer' : 'Supprimer',
          style: 'destructive',
          onPress: () => {
            if (option.danger) {
              Alert.alert(
                'Dernière confirmation',
                'Voulez-vous vraiment tout supprimer ? Cette action est définitive.',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Oui, tout supprimer', style: 'destructive', onPress: () => doReset(option) },
                ]
              );
            } else {
              doReset(option);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réinitialisation des données</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        {/* Warning banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={20} color={ORANGE} />
          <Text style={styles.warningText}>
            Ces actions sont <Text style={{ fontWeight: '900' }}>irréversibles</Text>. Les données supprimées ne peuvent pas être récupérées.
          </Text>
        </View>

        {/* What is kept */}
        <View style={styles.safeCard}>
          <Text style={styles.safeTitle}>✅ Toujours conservé</Text>
          {[
            'Votre compte et mot de passe',
            'Paramètres du bureau (nom, logo, téléphone)',
            'Devises et taux configurés',
            'Membres de l\'équipe',
            'Licence d\'abonnement',
          ].map((item, i) => (
            <View key={i} style={styles.safeRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color={GREEN} />
              <Text style={styles.safeText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Reset options */}
        <Text style={styles.sectionLabel}>CHOISIR CE À SUPPRIMER</Text>
        <View style={styles.optionsCard}>
          {OPTIONS.map((opt, i) => (
            <View key={opt.key}>
              <ResetOption
                option={opt}
                onPress={handleReset}
                loading={loadingKey === opt.key}
              />
              {i < OPTIONS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: RED, paddingHorizontal: SPACING.lg,
    paddingTop: 56, paddingBottom: SPACING.lg,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: '#fff' },

  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#fff7ed', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#fed7aa', marginBottom: 14,
  },
  warningText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 18 },

  safeCard: {
    backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 20,
  },
  safeTitle: { fontSize: 13, fontWeight: '800', color: '#166534', marginBottom: 8 },
  safeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  safeText: { fontSize: 12, color: '#166534' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#94a3b8',
    letterSpacing: 1, marginBottom: 8,
  },
  optionsCard: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  option: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
  },
  optionDanger: { backgroundColor: '#fff5f5' },
  optionIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  optionContent: { flex: 1 },
  optionTitle: { fontSize: 14, fontWeight: '700' },
  optionDesc: { fontSize: 11, color: '#64748b', marginTop: 3, lineHeight: 16 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 72 },

  accessDenied: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  accessDeniedText: { fontSize: 16, color: '#94a3b8', fontWeight: '600' },
});
