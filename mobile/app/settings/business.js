import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useSettingStore from '../../src/store/settingStore';
import useAuthStore from '../../src/store/authStore';

const API_URL = 'https://kabrak-exchange-pro-production.up.railway.app';

// Couleurs prédéfinies pour le color picker
const PRESET_COLORS = [
  { name: 'Vert Forêt', hex: '#0B6E4F' },
  { name: 'Bleu Marine', hex: '#1e3a8a' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Rouge', hex: '#dc2626' },
  { name: 'Rose', hex: '#db2777' },
  { name: 'Cyan', hex: '#0891b2' },
  { name: 'Vert Émeraude', hex: '#059669' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Jaune Or', hex: '#d97706' },
  { name: 'Gris Ardoise', hex: '#475569' },
  { name: 'Noir', hex: '#1f2937' },
];

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
  const { token: storeToken } = useAuthStore();
  const [form, setForm] = useState({
    businessName: '',
    businessPhone: '',
    businessAddress: '',
    businessEmail: '',
    brandColor: '#0B6E4F',
  });
  const [saving, setSaving] = useState(false);
  const [logoUri, setLogoUri] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
    if (settings.businessLogo) setLogoUri(settings.businessLogo);
  }, [settings]);

  const handlePickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'accès à vos photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', { uri, name: 'logo.jpg', type: 'image/jpeg' });
      const token = storeToken || await SecureStore.getItemAsync('auth_token');
      
      console.log('🔍 Logo upload - Token check:', {
        storeToken: !!storeToken,
        secureToken: !!token,
        tokenLength: token?.length,
        API_URL
      });
      
      if (!token) {
        Alert.alert('Erreur', 'Token non trouvé. Veuillez vous reconnecter.');
        return;
      }
      
      const res = await fetch(`${API_URL}/api/settings/upload-logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      console.log('🔍 Logo upload - Response status:', res.status);
      
      const data = await res.json();
      console.log('🔍 Logo upload - Response data:', data);
      
      if (data.success) {
        setLogoUri(data.data.businessLogo);
        await fetchSettings();
        Alert.alert('✅ Logo mis à jour', 'Votre logo a été enregistré.');
      } else {
        Alert.alert('Erreur', data.message);
      }
    } catch (e) {
      console.error('🔍 Logo upload - Error:', e);
      Alert.alert('Erreur', 'Upload échoué. Vérifiez votre connexion.');
    } finally {
      setUploadingLogo(false);
    }
  };

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

          {/* Logo Upload */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Logo de l'entreprise</Text>
            <View style={styles.logoRow}>
              <View style={styles.logoPreview}>
                {logoUri
                  ? <Image source={{ uri: logoUri }} style={styles.logoImg} resizeMode="contain" />
                  : <Ionicons name="image-outline" size={40} color={COLORS.textMuted} />
                }
              </View>
              <View style={styles.logoActions}>
                <Text style={styles.logoHint}>Format recommandé : carré, PNG/JPG, max 5MB</Text>
                <TouchableOpacity
                  style={[styles.uploadBtn, uploadingLogo && { opacity: 0.6 }]}
                  onPress={handlePickLogo}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : <><Ionicons name="cloud-upload-outline" size={16} color={COLORS.white} /><Text style={styles.uploadBtnText}>Choisir un logo</Text></>
                  }
                </TouchableOpacity>
              </View>
            </View>
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
            {/* Color Picker */}
            <View style={{ marginBottom: SPACING.md }}>
              <View style={styles.fieldLabel}>
                <Ionicons name="color-palette-outline" size={18} color={COLORS.textMuted} />
                <Text style={styles.labelText}>Couleur de marque</Text>
              </View>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color.hex}
                    style={[
                      styles.colorBox,
                      { backgroundColor: color.hex },
                      form.brandColor === color.hex && styles.colorBoxSelected
                    ]}
                    onPress={() => setForm(f => ({ ...f, brandColor: color.hex }))}
                    activeOpacity={0.7}
                  >
                    {form.brandColor === color.hex && (
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.colorHint}>Sélectionnez la couleur principale de votre entreprise</Text>
            </View>
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
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  logoPreview: {
    width: 80, height: 80, borderRadius: RADIUS.md,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.divider,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  logoImg: { width: 80, height: 80 },
  logoActions: { flex: 1 },
  logoHint: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginBottom: SPACING.sm },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start',
  },
  uploadBtnText: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  colorGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8,
  },
  colorBox: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  colorBoxSelected: {
    borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
    transform: [{ scale: 1.05 }],
  },
  colorHint: {
    fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 8,
  },
  fieldLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4,
  },
  labelText: {
    fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: FONTS.sizes.md },
});
