import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useSettingStore from '../../src/store/settingStore';

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', icon }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabel}>
        <Ionicons name={icon} size={16} color={COLORS.textSecondary} />
        <Text style={styles.fieldLabelText}>{label}</Text>
      </View>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export default function BusinessSettingsScreen() {
  const router = useRouter();
  const { settings, fetchSettings, updateSettings, isLoading } = useSettingStore();
  const [form, setForm] = useState({
    businessName: '',
    businessPhone: '',
    businessAddress: '',
    businessEmail: '',
    brandColor: '#0B6E4F',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    setForm({
      businessName: settings.businessName || '',
      businessPhone: settings.businessPhone || '',
      businessAddress: settings.businessAddress || '',
      businessEmail: settings.businessEmail || '',
      brandColor: settings.brandColor || '#0B6E4F',
    });
  }, [settings]);

  const handleSave = async () => {
    if (!form.businessName.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'entreprise est requis.');
      return;
    }
    setSaving(true);
    const result = await updateSettings(form);
    setSaving(false);
    if (result.success) {
      Alert.alert('✅ Enregistré', 'Paramètres mis à jour avec succès.');
    } else {
      Alert.alert('Erreur', result.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Mon entreprise</Text>
        <View style={{ width: 32 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
            <Text style={styles.infoText}>
              Ces informations apparaissent sur les reçus générés et sur le portail client.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Informations de l'entreprise</Text>

            <Field
              label="Nom de l'entreprise *"
              value={form.businessName}
              onChangeText={v => setForm(f => ({ ...f, businessName: v }))}
              placeholder="Ex: Bureau de Change Dupont"
              icon="business-outline"
            />
            <Field
              label="Téléphone"
              value={form.businessPhone}
              onChangeText={v => setForm(f => ({ ...f, businessPhone: v }))}
              placeholder="Ex: +225 07 00 00 00"
              keyboardType="phone-pad"
              icon="call-outline"
            />
            <Field
              label="Adresse"
              value={form.businessAddress}
              onChangeText={v => setForm(f => ({ ...f, businessAddress: v }))}
              placeholder="Ex: Rue du Commerce, Abidjan"
              icon="location-outline"
            />
            <Field
              label="Email"
              value={form.businessEmail}
              onChangeText={v => setForm(f => ({ ...f, businessEmail: v }))}
              placeholder="Ex: contact@monbureau.com"
              keyboardType="email-address"
              icon="mail-outline"
            />
            <Field
              label="Couleur de marque (hex)"
              value={form.brandColor}
              onChangeText={v => setForm(f => ({ ...f, brandColor: v }))}
              placeholder="Ex: #0B6E4F"
              icon="color-palette-outline"
            />
          </View>

          {/* Preview */}
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Aperçu en-tête reçu</Text>
            <View style={[styles.previewBox, { backgroundColor: form.brandColor || '#0B6E4F', borderLeftColor: form.brandColor || '#0B6E4F' }]}>
              <Text style={[styles.previewName, { color: '#fff' }]}>{form.businessName || 'Nom de l\'entreprise'}</Text>
              {form.businessPhone || form.businessAddress ? <Text style={[styles.previewSub, { color: 'rgba(255,255,255,0.7)' }]}>{[form.businessAddress, form.businessPhone].filter(Boolean).join(' · ')}</Text> : null}
              <Text style={[styles.previewSub, { color: 'rgba(255,255,255,0.5)', marginTop: 4, fontSize: 9 }]}>Powered by KABRAK Exchange Pro</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={COLORS.white} />
              : <><Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} /><Text style={styles.saveBtnText}>Enregistrer</Text></>
            }
          </TouchableOpacity>

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingTop: 56, paddingBottom: SPACING.lg,
  },
  backBtn: { padding: 4 },
  title: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  content: { padding: SPACING.lg },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.infoLight, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  infoText: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.info, lineHeight: 18 },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  field: { marginBottom: SPACING.md },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabelText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  fieldInput: {
    borderWidth: 1, borderColor: COLORS.divider, borderRadius: RADIUS.md,
    padding: SPACING.md, fontSize: FONTS.sizes.md, color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  previewCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    marginBottom: SPACING.md,
  },
  previewTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  previewBox: {
    backgroundColor: '#f8fffe', borderRadius: RADIUS.md, padding: SPACING.md,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary, alignItems: 'center',
  },
  previewName: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.primary, textAlign: 'center' },
  previewSub: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  previewDetail: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 4 },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: FONTS.sizes.md },
});
