import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, Modal, Dimensions, RefreshControl, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';

const BACKEND_URL = 'https://kabrak-exchange-pro-production.up.railway.app';
const { width: SW } = Dimensions.get('window');

const STATUS_CFG = {
  receipt_uploaded: { label: 'Reçu envoyé', color: '#0369a1', bg: '#e0f2fe' },
  confirmed: { label: 'Confirmé', color: '#0B6E4F', bg: '#e6f4ef' },
  rejected: { label: 'Rejeté', color: '#dc2626', bg: '#fee2e2' },
  pending: { label: 'En attente', color: '#d97706', bg: '#fef3c7' },
};

function fmt(n) { return parseFloat(n || 0).toLocaleString('fr-FR'); }

export default function ReceiptsGalleryScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedClient, setExpandedClient] = useState(null);
  const [showImage, setShowImage] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);

  const fetchReceipts = useCallback(async () => {
    try {
      const res = await api.get('/deposits/all-receipts');
      setGroups(res.data.data || []);
    } catch (e) {
      console.error('Error fetching receipts:', e);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  const onRefresh = () => { setRefreshing(true); fetchReceipts(); };

  const filtered = groups.filter(g =>
    !search || g.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const totalReceipts = filtered.reduce((sum, g) => sum + g.total, 0);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const openImage = (receipt) => {
    setImageUrl(getImageUrl(receipt.receiptImageUrl));
    setImageInfo(receipt);
    setShowImage(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Galerie des reçus</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un client..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={20} color={COLORS.primary} />
          <Text style={styles.statNumber}>{filtered.length}</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="images" size={20} color="#0369a1" />
          <Text style={styles.statNumber}>{totalReceipts}</Text>
          <Text style={styles.statLabel}>Reçus</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="images-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Aucun reçu trouvé</Text>
            </View>
          ) : (
            filtered.map((group) => (
              <View key={group.clientName} style={styles.clientSection}>
                <TouchableOpacity
                  style={styles.clientHeader}
                  onPress={() => setExpandedClient(expandedClient === group.clientName ? null : group.clientName)}
                  activeOpacity={0.7}
                >
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>{(group.clientName || '?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientName}>{group.clientName}</Text>
                    <Text style={styles.clientCount}>{group.total} reçu{group.total > 1 ? 's' : ''}</Text>
                  </View>
                  <Ionicons
                    name={expandedClient === group.clientName ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>

                {expandedClient === group.clientName && (
                  <View style={styles.receiptGrid}>
                    {group.receipts.map((r) => {
                      const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
                      return (
                        <TouchableOpacity
                          key={r.id}
                          style={styles.receiptCard}
                          onPress={() => openImage(r)}
                          activeOpacity={0.8}
                        >
                          <Image
                            source={{ uri: getImageUrl(r.receiptImageUrl) }}
                            style={styles.receiptThumb}
                            resizeMode="cover"
                          />
                          <View style={styles.receiptInfo}>
                            <Text style={styles.receiptCode}>{r.code}</Text>
                            <Text style={styles.receiptAmount}>{fmt(r.amount)} {r.currency}</Text>
                            <View style={[styles.receiptBadge, { backgroundColor: cfg.bg }]}>
                              <Text style={[styles.receiptBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                            </View>
                            <Text style={styles.receiptDate}>
                              {r.receiptUploadedAt ? new Date(r.receiptUploadedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            ))
          )}
          <View style={{ height: SPACING.xl * 2 }} />
        </ScrollView>
      )}

      {/* Full Image Modal */}
      <Modal visible={showImage} animationType="fade" transparent statusBarTranslucent>
        <View style={styles.imageOverlay}>
          <View style={styles.imageTopBar}>
            <TouchableOpacity onPress={() => setShowImage(false)} style={styles.imageCloseBtn}>
              <Ionicons name="close-circle" size={36} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          {imageInfo && (
            <View style={styles.imageInfoBar}>
              <Text style={styles.imageInfoText}>
                {imageInfo.clientName} · {imageInfo.code} · {fmt(imageInfo.amount)} {imageInfo.currency}
              </Text>
            </View>
          )}
          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
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

  searchRow: {
    flexDirection: 'row', alignItems: 'center', margin: SPACING.md,
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 10, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4
  },
  searchInput: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textPrimary },

  statsRow: {
    flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm
  },
  statCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4
  },
  statNumber: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.textMuted },

  clientSection: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.md, marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4
  },
  clientHeader: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm
  },
  clientAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center'
  },
  clientAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md },
  clientName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  clientCount: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 1 },

  receiptGrid: {
    paddingHorizontal: SPACING.sm, paddingBottom: SPACING.md, gap: SPACING.sm
  },
  receiptCard: {
    flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: RADIUS.md,
    overflow: 'hidden', gap: SPACING.sm
  },
  receiptThumb: { width: 80, height: 80 },
  receiptInfo: { flex: 1, padding: SPACING.sm, justifyContent: 'center' },
  receiptCode: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.primary },
  receiptAmount: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary, marginTop: 2 },
  receiptBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 1, borderRadius: RADIUS.full, marginTop: 3 },
  receiptBadgeText: { fontSize: 10, fontWeight: '700' },
  receiptDate: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },

  imageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  imageTopBar: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  imageCloseBtn: { padding: 4 },
  imageInfoBar: {
    position: 'absolute', bottom: 40, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 10, paddingHorizontal: 20
  },
  imageInfoText: { color: COLORS.white, fontSize: FONTS.sizes.sm, textAlign: 'center' },
  fullImage: { width: SW, height: SW * 1.2 },
});
