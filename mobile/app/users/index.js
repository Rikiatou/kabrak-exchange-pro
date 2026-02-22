import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useLanguageStore from '../../src/store/languageStore';
import { getInitials, formatRelative } from '../../src/utils/helpers';

function AddUserModal({ visible, onClose, onSuccess, t }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', phone: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      return Alert.alert(t.common.error, t.common.required);
    }
    setLoading(true);
    try {
      await api.post('/users', form);
      Alert.alert(t.common.success, t.users.createBtn);
      setForm({ name: '', email: '', password: '', role: 'employee', phone: '' });
      onSuccess();
      onClose();
    } catch (e) {
      Alert.alert(t.common.error, e.response?.data?.message || t.common.error);
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.users.new}</Text>
              <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
            </View>
            {[
              { key: 'name', label: t.clients.name, placeholder: 'Jean Dupont' },
              { key: 'email', label: t.common.email, placeholder: 'jean@exchange.com', keyboardType: 'email-address' },
              { key: 'password', label: t.users.password, placeholder: '••••••••', secure: true },
              { key: 'phone', label: t.common.phone, placeholder: '+33 6 12 34 56 78', keyboardType: 'phone-pad' }
            ].map((f) => (
              <View key={f.key} style={styles.field}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form[f.key]}
                  onChangeText={(v) => set(f.key, v)}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType={f.keyboardType || 'default'}
                  secureTextEntry={f.secure}
                  autoCapitalize="none"
                />
              </View>
            ))}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t.users.role}</Text>
              <View style={styles.roleRow}>
                {[{ key: 'employee', label: t.users.employee }, { key: 'admin', label: t.users.admin }].map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={[styles.roleBtn, form.role === r.key && styles.roleBtnActive]}
                    onPress={() => set('role', r.key)}
                  >
                    <Text style={[styles.roleBtnText, form.role === r.key && styles.roleBtnTextActive]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.modalBtn} onPress={handleCreate} disabled={loading}>
              <Text style={styles.modalBtnText}>{loading ? t.common.loading : t.users.createBtn}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function UserCard({ user, onToggle, t }) {
  const isAdmin = user.role === 'admin';
  return (
    <View style={styles.userCard}>
      <View style={styles.userLeft}>
        <View style={[styles.userAvatar, { backgroundColor: isAdmin ? COLORS.primary : COLORS.secondary }]}>
          <Text style={styles.userAvatarText}>{getInitials(user.name)}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.userMeta}>
            <View style={[styles.roleBadge, { backgroundColor: isAdmin ? COLORS.infoLight : COLORS.successLight }]}>
              <Text style={[styles.roleText, { color: isAdmin ? COLORS.info : COLORS.success }]}>
                {isAdmin ? t.users.admin : t.users.employee}
              </Text>
            </View>
            {user.lastLogin && (
              <Text style={styles.lastLogin}>{formatRelative(user.lastLogin)}</Text>
            )}
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.toggleBtn, { backgroundColor: user.isActive ? COLORS.successLight : COLORS.dangerLight }]}
        onPress={() => onToggle(user)}
      >
        <Ionicons
          name={user.isActive ? 'checkmark-circle' : 'close-circle'}
          size={20}
          color={user.isActive ? COLORS.success : COLORS.danger}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function UsersScreen() {
  const router = useRouter();
  const { t } = useLanguageStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleToggle = (user) => {
    Alert.alert(
      user.isActive ? t.users.deactivate : t.users.activate,
      `${user.isActive ? t.users.deactivate : t.users.activate} ${user.name} ?`,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.confirm, onPress: async () => {
            try {
              await api.put(`/users/${user.id}`, { isActive: !user.isActive });
              loadUsers();
            } catch (e) {
              Alert.alert(t.common.error, e.response?.data?.message || t.common.error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{t.users.title}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="person-add-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserCard user={item} onToggle={handleToggle} t={t} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadUsers} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>{t.users.noUsers}</Text>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />

      <AddUserModal visible={showModal} onClose={() => setShowModal(false)} onSuccess={loadUsers} t={t} />
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
  addBtn: { padding: 4 },
  list: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  userCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  userLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm
  },
  userAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md },
  userInfo: { flex: 1 },
  userName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary },
  userEmail: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, marginTop: 2 },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 4, flexWrap: 'wrap' },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  roleText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  lastLogin: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  toggleBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: FONTS.sizes.lg, color: COLORS.textSecondary, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.overlay },
  modalScroll: { justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg, paddingBottom: SPACING.xl
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  field: { marginBottom: SPACING.md },
  fieldLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 48, fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary, backgroundColor: COLORS.background
  },
  roleRow: { flexDirection: 'row', gap: SPACING.sm },
  roleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center'
  },
  roleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleBtnText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  roleBtnTextActive: { color: COLORS.white },
  modalBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 50, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.sm
  },
  modalBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md }
});
