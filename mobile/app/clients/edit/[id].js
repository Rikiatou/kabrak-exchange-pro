import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useClientStore from '../../../src/store/clientStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../../src/constants/colors';
import useLanguageStore from '../../../src/store/languageStore';

function FormField({ label, value, onChangeText, placeholder, keyboardType, required, multiline }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}{required && <Text style={{ color: COLORS.danger }}> *</Text>}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

export default function EditClientScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguageStore();
  const { fetchClientById, updateClient } = useClientStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', idNumber: '', idType: 'national_id', address: '', notes: ''
  });

  useEffect(() => {
    const load = async () => {
      const client = await fetchClientById(id);
      if (client) {
        setForm({
          name: client.name || '',
          phone: client.phone || '',
          email: client.email || '',
          idNumber: client.idNumber || '',
          idType: client.idType || 'national_id',
          address: client.address || '',
          notes: client.notes || ''
        });
      }
      setFetching(false);
    };
    load();
  }, [id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert(t.common.error, t.clients.name + ' ' + t.common.required);
      return;
    }
    setLoading(true);
    const result = await updateClient(id, form);
    setLoading(false);
    if (result.success) {
      Alert.alert(t.common.success, t.clients.updated, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert(t.common.error, result.message);
    }
  };

  if (fetching) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.clients.editTitle}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.clients.clientInfo}</Text>
            <FormField label={t.clients.name} value={form.name} onChangeText={(v) => set('name', v)} placeholder={t.clients.namePlaceholder} required />
            <FormField label={t.clients.phone} value={form.phone} onChangeText={(v) => set('phone', v)} placeholder={t.clients.phonePlaceholder} keyboardType="phone-pad" />
            <FormField label={t.clients.email} value={form.email} onChangeText={(v) => set('email', v)} placeholder={t.clients.emailPlaceholder} keyboardType="email-address" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.clients.idNumber}</Text>
            <FormField label={t.clients.idNumber} value={form.idNumber} onChangeText={(v) => set('idNumber', v)} placeholder={t.clients.idPlaceholder} />
            <View style={styles.field}>
              <Text style={styles.label}>{t.clients.idType}</Text>
              <View style={styles.typeRow}>
                {[
                  { key: 'national_id', label: t.clients.idTypeCni },
                  { key: 'passport', label: t.clients.idTypePassport },
                  { key: 'driver_license', label: t.clients.idTypeLicense },
                  { key: 'other', label: t.clients.idTypeOther }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.typeBtn, form.idType === item.key && styles.typeBtnActive]}
                    onPress={() => set('idType', item.key)}
                  >
                    <Text style={[styles.typeBtnText, form.idType === item.key && styles.typeBtnTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.clients.otherInfo}</Text>
            <FormField label={t.clients.address} value={form.address} onChangeText={(v) => set('address', v)} placeholder={t.clients.addressPlaceholder} />
            <FormField label={t.clients.notes} value={form.notes} onChangeText={(v) => set('notes', v)} placeholder={t.clients.notesPlaceholder} multiline />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : (
              <>
                <Ionicons name="save-outline" size={20} color={COLORS.white} />
                <Text style={styles.submitBtnText}>{t.clients.saveChanges}</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingTop: 56, paddingBottom: SPACING.lg
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  scroll: { padding: SPACING.lg },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3
  },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  field: { marginBottom: SPACING.md },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 48, fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary, backgroundColor: COLORS.background
  },
  inputMultiline: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  typeBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border
  },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  typeBtnTextActive: { color: COLORS.white },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 54, gap: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6
  },
  submitBtnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' }
});
