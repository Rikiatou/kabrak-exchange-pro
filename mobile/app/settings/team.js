import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import useAuthStore from '../../src/store/authStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';

const ROLE_LABELS = { owner: 'Propriétaire', manager: 'Manager', cashier: 'Caissier' };
const ROLE_COLORS = { owner: '#6366f1', manager: '#0369a1', cashier: '#059669' };

export default function TeamScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', teamRole: 'cashier' });
  const [submitting, setSubmitting] = useState(false);

  const canManage = user?.role === 'admin' || user?.teamRole === 'owner' || user?.teamRole === 'manager';
  const isOwnerOrAdmin = user?.role === 'admin' || user?.teamRole === 'owner';

  const fetchTeam = useCallback(async () => {
    try {
      const res = await api.get('/team');
      setMembers(res.data.data || []);
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible de charger l\'équipe');
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const onRefresh = () => { setRefreshing(true); fetchTeam(); };

  const handleInvite = async () => {
    const { firstName, email, password } = inviteForm;
    if (!firstName || !email || !password) {
      Alert.alert('Erreur', 'Prénom, email et mot de passe sont requis.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/team/invite', inviteForm);
      Alert.alert('Succès', `${firstName} a été ajouté à l'équipe.`);
      setShowInvite(false);
      setInviteForm({ firstName: '', lastName: '', email: '', phone: '', password: '', teamRole: 'cashier' });
      fetchTeam();
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible d\'ajouter le membre');
    }
    setSubmitting(false);
  };

  const handleRemove = (member) => {
    Alert.alert(
      'Retirer le membre',
      `Voulez-vous retirer ${member.firstName} ${member.lastName || ''} de l'équipe ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Retirer', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/team/${member.id}`);
            fetchTeam();
          } catch (e) {
            Alert.alert('Erreur', e.response?.data?.message || 'Impossible de retirer le membre');
          }
        }}
      ]
    );
  };

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPwd, setResetPwd] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPassword = (member) => {
    setResetTarget(member);
    setResetPwd('');
    setShowResetModal(true);
  };

  const doResetPassword = async () => {
    if (!resetPwd || resetPwd.length < 6) { Alert.alert('Erreur', 'Min 6 caractères'); return; }
    setResetLoading(true);
    try {
      await api.put(`/team/${resetTarget.id}/reset-password`, { newPassword: resetPwd });
      Alert.alert('Succès', 'Mot de passe réinitialisé.');
      setShowResetModal(false);
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Erreur');
    }
    setResetLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Mon Équipe</Text>
        {canManage ? (
          <TouchableOpacity onPress={() => setShowInvite(true)} style={styles.backBtn}>
            <Ionicons name="person-add-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        ) : <View style={{ width: 32 }} />}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          <View style={styles.countCard}>
            <Ionicons name="people" size={28} color={COLORS.primary} />
            <Text style={styles.countText}>{members.length} membre{members.length > 1 ? 's' : ''}</Text>
          </View>

          {members.map((m) => (
            <View key={m.id} style={styles.memberCard}>
              <View style={styles.memberRow}>
                <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[m.teamRole] || COLORS.primary }]}>
                  <Text style={styles.avatarText}>
                    {(m.firstName || '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{m.firstName} {m.lastName || ''}</Text>
                  <Text style={styles.memberEmail}>{m.email}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: `${ROLE_COLORS[m.teamRole] || COLORS.primary}20` }]}>
                    <Text style={[styles.roleText, { color: ROLE_COLORS[m.teamRole] || COLORS.primary }]}>
                      {ROLE_LABELS[m.teamRole] || m.teamRole}
                    </Text>
                  </View>
                </View>
                {canManage && m.teamRole !== 'owner' && m.id !== user?.id && (
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleResetPassword(m)} style={styles.actionBtn}>
                      <Ionicons name="key-outline" size={18} color={COLORS.warning} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemove(m)} style={styles.actionBtn}>
                      <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {m.lastLogin && (
                <Text style={styles.lastLogin}>
                  Dernière connexion: {new Date(m.lastLogin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
          ))}

          <View style={{ height: SPACING.xl * 2 }} />
        </ScrollView>
      )}

      {/* Reset Password Modal */}
      <Modal visible={showResetModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '50%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau mot de passe</Text>
              <TouchableOpacity onPress={() => setShowResetModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.md }}>
              Réinitialiser le mot de passe de {resetTarget?.firstName}
            </Text>
            <TextInput
              style={styles.input}
              value={resetPwd}
              onChangeText={setResetPwd}
              placeholder="Nouveau mot de passe (min 6 car.)"
              secureTextEntry
              autoFocus
            />
            <TouchableOpacity
              style={[styles.submitBtn, { marginTop: SPACING.lg, opacity: resetLoading ? 0.6 : 1 }]}
              onPress={doResetPassword}
              disabled={resetLoading}
            >
              {resetLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitBtnText}>Confirmer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Invite Modal */}
      <Modal visible={showInvite} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un membre</Text>
              <TouchableOpacity onPress={() => setShowInvite(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Prénom *</Text>
              <TextInput
                style={styles.input}
                value={inviteForm.firstName}
                onChangeText={(v) => setInviteForm(f => ({ ...f, firstName: v }))}
                placeholder="Prénom"
              />

              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput
                style={styles.input}
                value={inviteForm.lastName}
                onChangeText={(v) => setInviteForm(f => ({ ...f, lastName: v }))}
                placeholder="Nom de famille"
              />

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                value={inviteForm.email}
                onChangeText={(v) => setInviteForm(f => ({ ...f, email: v }))}
                placeholder="email@exemple.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={inviteForm.phone}
                onChangeText={(v) => setInviteForm(f => ({ ...f, phone: v }))}
                placeholder="+237..."
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Mot de passe *</Text>
              <TextInput
                style={styles.input}
                value={inviteForm.password}
                onChangeText={(v) => setInviteForm(f => ({ ...f, password: v }))}
                placeholder="Min 6 caractères"
                secureTextEntry
              />

              <Text style={styles.inputLabel}>Rôle</Text>
              <View style={styles.roleSelector}>
                {['cashier', 'manager'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleOption, inviteForm.teamRole === role && styles.roleOptionActive]}
                    onPress={() => setInviteForm(f => ({ ...f, teamRole: role }))}
                  >
                    <Ionicons
                      name={role === 'manager' ? 'shield-outline' : 'person-outline'}
                      size={18}
                      color={inviteForm.teamRole === role ? COLORS.white : COLORS.textSecondary}
                    />
                    <Text style={[styles.roleOptionText, inviteForm.teamRole === role && styles.roleOptionTextActive]}>
                      {ROLE_LABELS[role]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleInvite}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Ajouter à l'équipe</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  countCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.white, margin: SPACING.lg, borderRadius: RADIUS.lg,
    padding: SPACING.md, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  countText: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  memberCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2
  },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm
  },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.lg },
  memberInfo: { flex: 1 },
  memberName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  memberEmail: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 1 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, marginTop: 4 },
  roleText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6, borderRadius: RADIUS.md, backgroundColor: COLORS.background },
  lastLogin: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 8, marginLeft: 56 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg, maxHeight: '85%'
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  inputLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4, marginTop: SPACING.sm },
  input: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md,
    fontSize: FONTS.sizes.md, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border
  },
  roleSelector: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
  roleOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border
  },
  roleOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleOptionText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  roleOptionTextActive: { color: COLORS.white },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.md,
    alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xl
  },
  submitBtnText: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700' }
});
