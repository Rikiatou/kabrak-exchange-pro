import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../src/store/authStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useLanguageStore from '../../src/store/languageStore';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword } = useAuthStore();
  const { t } = useLanguageStore();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      return Alert.alert(t.common.error, t.common.required);
    }
    if (form.newPassword !== form.confirmPassword) {
      return Alert.alert(t.common.error, t.settings.passwordMismatch);
    }
    if (form.newPassword.length < 6) {
      return Alert.alert(t.common.error, t.settings.passwordMismatch);
    }
    setLoading(true);
    const result = await changePassword(form.currentPassword, form.newPassword);
    setLoading(false);
    if (result.success) {
      Alert.alert(t.common.success, t.settings.passwordUpdated, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert(t.common.error, result.message);
    }
  };

  const fields = [
    { key: 'currentPassword', label: t.settings.currentPassword, showKey: 'current' },
    { key: 'newPassword', label: t.settings.newPassword, showKey: 'new' },
    { key: 'confirmPassword', label: t.settings.confirmPassword, showKey: 'confirm' }
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.title}>{t.settings.changePassword}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {fields.map((f) => (
              <View key={f.key} style={styles.field}>
                <Text style={styles.label}>{f.label}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={form[f.key]}
                    onChangeText={(v) => set(f.key, v)}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!show[f.showKey]}
                  />
                  <TouchableOpacity onPress={() => setShow(s => ({ ...s, [f.showKey]: !s[f.showKey] }))}>
                    <Ionicons name={show[f.showKey] ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.submitBtnText}>{t.settings.updatePassword}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  scroll: { padding: SPACING.lg },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  field: { marginBottom: SPACING.md },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, backgroundColor: COLORS.background
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 54, gap: 8
  },
  submitBtnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' }
});
