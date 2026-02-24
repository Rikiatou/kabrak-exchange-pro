import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput, ScrollView,
  ActivityIndicator, Clipboard, Image, Dimensions, Linking
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useDepositOrderStore from '../../src/store/depositOrderStore';
import useDepositStore from '../../src/store/depositStore';
import useLanguageStore from '../../src/store/languageStore';
import useClientStore from '../../src/store/clientStore';
import useSettingStore from '../../src/store/settingStore';
import { shareDepositReceipt } from '../../src/utils/generateReceipt';
import useAuthStore from '../../src/store/authStore';

const UPLOAD_BASE = 'https://exchange.kabrakeng.com/upload';
const BACKEND_URL = 'https://kabrak-exchange-pro-production.up.railway.app';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const ORDER_STATUS = {
  pending:   { label: 'En attente', labelEn: 'Pending',   color: '#d97706', bg: '#fef3c7', icon: 'time-outline' },
  partial:   { label: 'Partiel',    labelEn: 'Partial',   color: '#0369a1', bg: '#e0f2fe', icon: 'git-branch-outline' },
  completed: { label: 'Complété',   labelEn: 'Completed', color: '#0B6E4F', bg: '#e6f4ef', icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Annulé',     labelEn: 'Cancelled', color: '#dc2626', bg: '#fee2e2', icon: 'close-circle-outline' },
};

const PAY_STATUS = {
  pending:          { label: 'En attente', labelEn: 'Pending',       color: '#d97706', bg: '#fef3c7', icon: 'time-outline' },
  receipt_uploaded: { label: 'Reçu reçu',  labelEn: 'Receipt sent',  color: '#0369a1', bg: '#e0f2fe', icon: 'cloud-upload-outline' },
  confirmed:        { label: 'Confirmé',   labelEn: 'Confirmed',     color: '#0B6E4F', bg: '#e6f4ef', icon: 'checkmark-circle-outline' },
  rejected:         { label: 'Rejeté',     labelEn: 'Rejected',      color: '#dc2626', bg: '#fee2e2', icon: 'close-circle-outline' },
};

function fmt(n) { return parseFloat(n || 0).toLocaleString('fr-FR'); }

function Badge({ cfg, lang }) {
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon} size={11} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{lang === 'fr' ? cfg.label : cfg.labelEn}</Text>
    </View>
  );
}

function ProgressBar({ received, total }) {
  const pct = Math.min(1, parseFloat(received || 0) / Math.max(1, parseFloat(total)));
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: pct >= 1 ? COLORS.primary : '#0369a1' }]} />
    </View>
  );
}

function OrderCard({ order, lang, onPress }) {
  const cfg = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  const received = parseFloat(order.receivedAmount || 0);
  const total = parseFloat(order.totalAmount);
  const remaining = parseFloat(order.remainingAmount || total);
  const pendingReceipts = (order.payments || []).filter(p => p.status === 'receipt_uploaded').length;
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(order)} activeOpacity={0.75}>
      <View style={[styles.cardLeft, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={22} color={cfg.color} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardName} numberOfLines={1}>{order.clientName}</Text>
          <Text style={styles.cardCode}>{order.reference}</Text>
        </View>
        <ProgressBar received={received} total={total} />
        <View style={styles.cardRow}>
          <Text style={styles.cardAmount}>{fmt(received)} / {fmt(total)} {order.currency}</Text>
          <Badge cfg={cfg} lang={lang} />
        </View>
        <View style={styles.cardRow}>
          {remaining > 0
            ? <Text style={styles.cardRemaining}>{lang === 'fr' ? 'Restant' : 'Remaining'} : {fmt(remaining)} {order.currency}</Text>
            : <Text style={[styles.cardRemaining, { color: COLORS.primary }]}>✅ {lang === 'fr' ? 'Complet' : 'Complete'}</Text>
          }
          {pendingReceipts > 0 && (
            <View style={styles.alertDot}>
              <Text style={styles.alertDotText}>{pendingReceipts} reçu{pendingReceipts > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
        {order.bank ? <Text style={styles.cardBank}>{order.bank}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function DepositsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { orders, loading, fetchOrders, createOrder, addPayment, cancelOrder } = useDepositOrderStore();
  const { confirmDeposit, rejectDeposit } = useDepositStore();
  const { language: lang } = useLanguageStore();
  const { clients, fetchClients, createClient } = useClientStore();
  const { settings, fetchSettings } = useSettingStore();
  const { expoPushToken } = useAuthStore();

  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: '', phone: '' });
  const [savingClient, setSavingClient] = useState(false);

  const [form, setForm] = useState({ clientName: '', clientPhone: '', clientId: null, amountForeign: '', foreignCurrency: 'EUR', rate: '', totalAmount: '', currency: 'FCFA', bank: '', notes: '' });
  const [payForm, setPayForm] = useState({ amount: '', notes: '' });

  const load = useCallback(() => {
    const params = {};
    if (filterStatus) params.status = filterStatus;
    if (search) params.search = search;
    fetchOrders(params);
  }, [filterStatus, search]);

  useEffect(() => {
    load();
    fetchClients();
    fetchSettings();
  }, []);

  useEffect(() => { load(); }, [filterStatus]);

  // Auto-refresh when screen gets focus
  useFocusEffect(useCallback(() => { load(); }, [filterStatus]));

  // Handle clientId from params (when coming from client page)
  useEffect(() => {
    if (params.clientId && clients.length > 0) {
      const client = clients.find(c => c.id === params.clientId);
      if (client) {
        setForm({
          clientName: client.name,
          clientPhone: client.phone || '',
          clientId: client.id,
          amountForeign: '',
          foreignCurrency: 'EUR',
          rate: '',
          totalAmount: '',
          currency: 'FCFA',
          bank: '',
          notes: ''
        });
        setShowNew(true); // Auto-open the new order modal
      }
    }
  }, [params.clientId, clients]);

  const handleCreateOrder = async () => {
    if (!form.clientName || !form.totalAmount || !form.currency) {
      Alert.alert(lang === 'fr' ? 'Erreur' : 'Error', lang === 'fr' ? 'Nom, montant total et devise requis' : 'Name, total amount and currency required');
      return;
    }
    setSaving(true);
    const result = await createOrder({
      ...form,
      totalAmount: parseFloat(form.totalAmount.replace(/\s/g, '')),
      amountForeign: form.amountForeign ? parseFloat(String(form.amountForeign).replace(/\s/g, '')) : null,
      rate: form.rate ? parseFloat(String(form.rate).replace(/\s/g, '')) : null,
      expoPushToken: expoPushToken || null,
    });
    setSaving(false);
    if (result.success) {
      setShowNew(false);
      setClientSearch('');
      setForm({ clientName: '', clientPhone: '', clientId: null, amountForeign: '', foreignCurrency: 'EUR', rate: '', totalAmount: '', currency: 'FCFA', bank: '', notes: '' });
      setFilterStatus(''); // reset to "Tous" so new pending order is visible
      setSearch('');
      setSelected(result.data);
      setShowDetail(true);
      load(); // force refresh
    } else {
      Alert.alert(lang === 'fr' ? 'Erreur' : 'Error', result.message);
    }
  };

  const handleAddPayment = async () => {
    if (!payForm.amount) {
      Alert.alert(lang === 'fr' ? 'Erreur' : 'Error', lang === 'fr' ? 'Montant requis' : 'Amount required');
      return;
    }
    setSaving(true);
    const result = await addPayment(selected.id, { amount: parseFloat(payForm.amount.replace(/\s/g, '')), notes: payForm.notes });
    setSaving(false);
    if (result.success) {
      setShowAddPayment(false);
      setPayForm({ amount: '', notes: '' });
      const refreshed = await useDepositOrderStore.getState().getOrder(selected.id);
      if (refreshed.success) setSelected(refreshed.data);
      load();
    } else {
      Alert.alert(lang === 'fr' ? 'Erreur' : 'Error', result.message);
    }
  };

  const handleConfirmPayment = (payment) => {
    Alert.alert(
      lang === 'fr' ? 'Confirmer versement' : 'Confirm payment',
      `${fmt(payment.amount)} ${selected?.currency} — ${payment.code}`,
      [
        { text: lang === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'fr' ? 'Confirmer ✅' : 'Confirm ✅',
          onPress: async () => {
            const res = await confirmDeposit(payment.id);
            if (res.success) {
              const refreshed = await useDepositOrderStore.getState().getOrder(selected.id);
              if (refreshed.success) setSelected(refreshed.data);
              load();
            } else Alert.alert('Erreur', res.message);
          }
        }
      ]
    );
  };

  const handleRejectPayment = (payment) => {
    Alert.alert(
      lang === 'fr' ? 'Rejeter versement' : 'Reject payment',
      `${fmt(payment.amount)} ${selected?.currency} — ${payment.code}`,
      [
        { text: lang === 'fr' ? 'Annuler' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'fr' ? 'Rejeter ❌' : 'Reject ❌',
          style: 'destructive',
          onPress: async () => {
            const res = await rejectDeposit(payment.id);
            if (res.success) {
              const refreshed = await useDepositOrderStore.getState().getOrder(selected.id);
              if (refreshed.success) setSelected(refreshed.data);
              load();
            } else Alert.alert('Erreur', res.message);
          }
        }
      ]
    );
  };

  const handleCancelOrder = (order) => {
    Alert.alert(
      lang === 'fr' ? 'Annuler la commande' : 'Cancel order',
      lang === 'fr' ? 'Annuler cette commande ?' : 'Cancel this order?',
      [
        { text: lang === 'fr' ? 'Non' : 'No', style: 'cancel' },
        {
          text: lang === 'fr' ? 'Annuler' : 'Cancel', style: 'destructive',
          onPress: async () => {
            await cancelOrder(order.id);
            setShowDetail(false);
            load();
          }
        }
      ]
    );
  };

  const copyLink = (code) => {
    const link = `${UPLOAD_BASE}/${code}`;
    Clipboard.setString(link);
    Alert.alert('✅', lang === 'fr' ? `Lien copié !\n\n${link}` : `Link copied!\n\n${link}`);
  };

  const sendWhatsApp = (order, paymentCode) => {
    const link = `${UPLOAD_BASE}/${paymentCode}`;
    const msg = lang === 'fr'
      ? `Bonjour ${order.clientName},\nMerci d'uploader votre reçu de versement ici :\n${link}\nRéférence : ${paymentCode}`
      : `Hello ${order.clientName},\nPlease upload your deposit receipt here:\n${link}\nReference: ${paymentCode}`;

    const phone = (order.clientPhone || '').replace(/[^0-9+]/g, '');
    if (phone) {
      // Ouvrir WhatsApp directement avec le numéro du client
      const waUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(msg)}`;
      Linking.canOpenURL(waUrl).then(supported => {
        if (supported) {
          Linking.openURL(waUrl);
        } else {
          // Fallback : copier le message
          Clipboard.setString(msg);
          Alert.alert('WhatsApp non installé', lang === 'fr' ? 'Message copié dans le presse-papier.' : 'Message copied to clipboard.');
        }
      });
    } else {
      // Pas de numéro : copier le message
      Clipboard.setString(msg);
      Alert.alert('⚠️', lang === 'fr' ? 'Numéro client manquant. Message copié.' : 'No client phone. Message copied.');
    }
  };

  const FILTERS = [
    { key: '', label: lang === 'fr' ? 'Tous' : 'All' },
    { key: 'pending', label: lang === 'fr' ? 'En attente' : 'Pending' },
    { key: 'partial', label: lang === 'fr' ? 'Partiel' : 'Partial' },
    { key: 'completed', label: lang === 'fr' ? 'Complétés' : 'Completed' },
    { key: 'cancelled', label: lang === 'fr' ? 'Annulés' : 'Cancelled' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{lang === 'fr' ? 'Dépôts' : 'Deposits'}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowNew(true)}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={lang === 'fr' ? 'Rechercher client, référence...' : 'Search client, reference...'}
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={load}
        />
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filterStatus === f.key && styles.filterBtnActive]}
            onPress={() => setFilterStatus(f.key)}
          >
            <Text style={[styles.filterText, filterStatus === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders list */}
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <OrderCard order={item} lang={lang} onPress={o => { setSelected(o); setShowDetail(true); }} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="wallet-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>{lang === 'fr' ? 'Aucune commande' : 'No orders'}</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowNew(true)}>
                <Text style={styles.emptyBtnText}>{lang === 'fr' ? '+ Nouvelle commande' : '+ New order'}</Text>
              </TouchableOpacity>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />

      {/* ── NEW ORDER MODAL ── */}
      <Modal visible={showNew} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{lang === 'fr' ? '+ Nouvelle commande' : '+ New order'}</Text>
              <TouchableOpacity onPress={() => setShowNew(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Client */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{lang === 'fr' ? 'Client *' : 'Client *'}</Text>
                {form.clientId ? (
                  <View style={styles.clientSelected}>
                    <View style={styles.clientSelectedAvatar}>
                      <Text style={styles.clientSelectedAvatarText}>{(form.clientName || '?')[0].toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clientSelectedName}>{form.clientName}</Text>
                      {form.clientPhone ? <Text style={styles.clientSelectedPhone}>{form.clientPhone}</Text> : null}
                    </View>
                    <TouchableOpacity onPress={() => setForm(p => ({ ...p, clientId: null, clientName: '', clientPhone: '' }))}>
                      <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder={lang === 'fr' ? 'Rechercher ou saisir un nom...' : 'Search or type a name...'}
                      placeholderTextColor={COLORS.textMuted}
                      value={clientSearch || form.clientName}
                      onChangeText={v => { setClientSearch(v); setForm(p => ({ ...p, clientName: v, clientId: null })); }}
                    />
                    {clientSearch.length > 0 && (
                      <View style={styles.clientDropdown}>
                        {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 5).map(c => (
                          <TouchableOpacity key={c.id} style={styles.clientDropdownItem} onPress={() => {
                            setForm(p => ({ ...p, clientId: c.id, clientName: c.name, clientPhone: c.phone || '' }));
                            setClientSearch('');
                            setShowNewClient(false);
                          }}>
                            <Text style={styles.clientDropdownName}>{c.name}</Text>
                            {c.phone ? <Text style={styles.clientDropdownPhone}>{c.phone}</Text> : null}
                          </TouchableOpacity>
                        ))}
                        {/* Bouton créer nouveau client */}
                        <TouchableOpacity
                          style={[styles.clientDropdownItem, { borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                          onPress={() => {
                            setNewClientForm({ name: clientSearch, phone: '' });
                            setShowNewClient(true);
                          }}
                        >
                          <Ionicons name="person-add-outline" size={16} color={COLORS.primary} />
                          <Text style={[styles.clientDropdownName, { color: COLORS.primary }]}>
                            {lang === 'fr' ? `Créer "${clientSearch}"` : `Create "${clientSearch}"`}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {/* Mini formulaire création client inline */}
                    {showNewClient && (
                      <View style={styles.newClientBox}>
                        <Text style={styles.fieldLabel}>{lang === 'fr' ? 'Nouveau client' : 'New client'}</Text>
                        <TextInput
                          style={[styles.fieldInput, { marginBottom: 8 }]}
                          placeholder={lang === 'fr' ? 'Nom complet *' : 'Full name *'}
                          placeholderTextColor={COLORS.textMuted}
                          value={newClientForm.name}
                          onChangeText={v => setNewClientForm(p => ({ ...p, name: v }))}
                        />
                        <TextInput
                          style={[styles.fieldInput, { marginBottom: 10 }]}
                          placeholder={lang === 'fr' ? 'Téléphone (optionnel)' : 'Phone (optional)'}
                          placeholderTextColor={COLORS.textMuted}
                          value={newClientForm.phone}
                          onChangeText={v => setNewClientForm(p => ({ ...p, phone: v }))}
                          keyboardType="phone-pad"
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            style={[styles.submitBtn, { flex: 1, backgroundColor: COLORS.textMuted, paddingVertical: 10 }]}
                            onPress={() => { setShowNewClient(false); setNewClientForm({ name: '', phone: '' }); }}
                          >
                            <Text style={styles.submitText}>{lang === 'fr' ? 'Annuler' : 'Cancel'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.submitBtn, { flex: 2, paddingVertical: 10 }]}
                            disabled={savingClient}
                            onPress={async () => {
                              if (!newClientForm.name.trim()) return;
                              setSavingClient(true);
                              const r = await createClient({ name: newClientForm.name.trim(), phone: newClientForm.phone.trim() || undefined });
                              setSavingClient(false);
                              if (r.success) {
                                setForm(p => ({ ...p, clientId: r.data.id, clientName: r.data.name, clientPhone: r.data.phone || '' }));
                                setClientSearch('');
                                setShowNewClient(false);
                                setNewClientForm({ name: '', phone: '' });
                              } else {
                                Alert.alert('Erreur', r.message);
                              }
                            }}
                          >
                            {savingClient
                              ? <ActivityIndicator color={COLORS.white} size="small" />
                              : <Text style={styles.submitText}>{lang === 'fr' ? 'Créer & Sélectionner' : 'Create & Select'}</Text>
                            }
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Total FCFA */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{lang === 'fr' ? 'Montant total à recevoir (FCFA) *' : 'Total amount to receive (FCFA) *'}</Text>
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputLarge]}
                  placeholder="7 000 000"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.totalAmount}
                  onChangeText={v => setForm(p => ({ ...p, totalAmount: v }))}
                  keyboardType="numeric"
                />
              </View>

              {/* Bank (optional) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{lang === 'fr' ? 'Banque (optionnel)' : 'Bank (optional)'}</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="SGBF, Coris, Ecobank..."
                  placeholderTextColor={COLORS.textMuted}
                  value={form.bank}
                  onChangeText={v => setForm(p => ({ ...p, bank: v }))}
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateOrder} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>{lang === 'fr' ? 'Créer la commande' : 'Create order'}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── ORDER DETAIL MODAL ── */}
      <Modal visible={showDetail && !!selected} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selected && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selected.reference}</Text>
                  <TouchableOpacity onPress={() => setShowDetail(false)}>
                    <Ionicons name="close" size={22} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Progress summary */}
                  <View style={styles.summaryBox}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>{lang === 'fr' ? 'Total' : 'Total'}</Text>
                        <Text style={styles.summaryValue}>{fmt(selected.totalAmount)}</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>{lang === 'fr' ? 'Reçu' : 'Received'}</Text>
                        <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{fmt(selected.receivedAmount)}</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>{lang === 'fr' ? 'Restant' : 'Remaining'}</Text>
                        <Text style={[styles.summaryValue, { color: parseFloat(selected.remainingAmount) > 0 ? COLORS.warning : COLORS.primary }]}>{fmt(selected.remainingAmount)}</Text>
                      </View>
                    </View>
                    <ProgressBar received={selected.receivedAmount} total={selected.totalAmount} />
                    <View style={{ marginTop: 8, alignItems: 'flex-start' }}>
                      <Badge cfg={ORDER_STATUS[selected.status] || ORDER_STATUS.pending} lang={lang} />
                    </View>
                  </View>

                  {/* Info */}
                  {[
                    { label: 'Client', value: selected.clientName },
                    { label: lang === 'fr' ? 'Téléphone' : 'Phone', value: selected.clientPhone || '—' },
                    { label: lang === 'fr' ? 'Devise' : 'Currency', value: selected.currency },
                    { label: lang === 'fr' ? 'Banque' : 'Bank', value: selected.bank || '—' },
                  ].map(row => (
                    <View key={row.label} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{row.label}</Text>
                      <Text style={styles.detailValue}>{row.value}</Text>
                    </View>
                  ))}

                  {/* Payments list */}
                  <View style={styles.paymentsSection}>
                    <Text style={styles.fieldLabel}>{lang === 'fr' ? 'Versements' : 'Payments'} ({(selected.payments || []).length})</Text>
                    {(selected.payments || []).map((p, i) => {
                      const pcfg = PAY_STATUS[p.status] || PAY_STATUS.pending;
                      return (
                        <View key={p.id} style={styles.paymentRow}>
                          <View style={[styles.paymentDot, { backgroundColor: pcfg.bg }]}>
                            <Ionicons name={pcfg.icon} size={14} color={pcfg.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={styles.paymentCode}>{p.code}</Text>
                              <Text style={styles.paymentAmount}>{fmt(p.amount)} {selected.currency}</Text>
                            </View>
                            <Badge cfg={pcfg} lang={lang} />
                          </View>
                          {/* Actions for this payment */}
                          {p.status === 'pending' && (
                            <View style={styles.payLinkBtns}>
                              <TouchableOpacity onPress={() => copyLink(p.code)} style={styles.payIconBtn}>
                                <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => sendWhatsApp(selected, p.code)} style={[styles.payIconBtn, { backgroundColor: '#25D36622' }]}>
                                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                              </TouchableOpacity>
                            </View>
                          )}
                          {p.status === 'receipt_uploaded' && (
                            <View style={styles.payLinkBtns}>
                              <TouchableOpacity onPress={() => { setReceiptUrl(p.receiptImageUrl?.startsWith('http') ? p.receiptImageUrl : `${BACKEND_URL}${p.receiptImageUrl}`); setShowReceipt(true); }} style={[styles.payIconBtn, { backgroundColor: '#e0f2fe' }]}>
                                <Ionicons name="eye-outline" size={16} color={COLORS.info} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleConfirmPayment(p)} style={[styles.payIconBtn, { backgroundColor: COLORS.successLight }]}>
                                <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleRejectPayment(p)} style={[styles.payIconBtn, { backgroundColor: COLORS.dangerLight }]}>
                                <Ionicons name="close" size={16} color={COLORS.danger} />
                              </TouchableOpacity>
                            </View>
                          )}
                          {p.status === 'confirmed' && (
                            <View style={styles.payLinkBtns}>
                              {p.receiptImageUrl && (
                                <TouchableOpacity onPress={() => { setReceiptUrl(p.receiptImageUrl?.startsWith('http') ? p.receiptImageUrl : `${BACKEND_URL}${p.receiptImageUrl}`); setShowReceipt(true); }} style={[styles.payIconBtn, { backgroundColor: COLORS.successLight }]}>
                                  <Ionicons name="image-outline" size={16} color={COLORS.primary} />
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity
                                onPress={() => shareDepositReceipt({ order: selected, payment: p, settings })}
                                style={[styles.payIconBtn, { backgroundColor: '#e0f2fe' }]}
                              >
                                <Ionicons name="share-outline" size={16} color="#0369a1" />
                              </TouchableOpacity>
                            </View>
                          )}
                          {p.status === 'rejected' && p.receiptImageUrl && (
                            <TouchableOpacity onPress={() => { setReceiptUrl(p.receiptImageUrl?.startsWith('http') ? p.receiptImageUrl : `${BACKEND_URL}${p.receiptImageUrl}`); setShowReceipt(true); }} style={[styles.payIconBtn, { backgroundColor: COLORS.dangerLight }]}>
                              <Ionicons name="image-outline" size={16} color={COLORS.danger} />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Add payment button */}
                  {selected.status !== 'completed' && selected.status !== 'cancelled' && (
                    <TouchableOpacity style={styles.addPayBtn} onPress={() => setShowAddPayment(true)}>
                      <Ionicons name="add-circle-outline" size={18} color={COLORS.white} />
                      <Text style={styles.addPayBtnText}>{lang === 'fr' ? '+ Ajouter un versement' : '+ Add payment'}</Text>
                    </TouchableOpacity>
                  )}

                  {/* Cancel order */}
                  {selected.status !== 'completed' && selected.status !== 'cancelled' && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelOrder(selected)}>
                      <Text style={styles.cancelBtnText}>{lang === 'fr' ? 'Annuler la commande' : 'Cancel order'}</Text>
                    </TouchableOpacity>
                  )}
                  <View style={{ height: SPACING.xl }} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── RECEIPT IMAGE MODAL ── */}
      <Modal visible={showReceipt} animationType="fade" transparent statusBarTranslucent>
        <View style={styles.receiptOverlay}>
          <TouchableOpacity style={styles.receiptClose} onPress={() => setShowReceipt(false)}>
            <Ionicons name="close-circle" size={36} color={COLORS.white} />
          </TouchableOpacity>
          {receiptUrl && (
            <Image
              source={{ uri: receiptUrl }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* ── ADD PAYMENT MODAL ── */}
      <Modal visible={showAddPayment} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '55%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{lang === 'fr' ? '+ Ajouter un versement' : '+ Add payment'}</Text>
              <TouchableOpacity onPress={() => setShowAddPayment(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {selected && (
              <View style={styles.remainingHint}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.info} />
                <Text style={styles.remainingHintText}>{lang === 'fr' ? 'Restant' : 'Remaining'}: {fmt(selected.remainingAmount)} {selected.currency}</Text>
              </View>
            )}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{lang === 'fr' ? 'Montant du versement *' : 'Payment amount *'}</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder={`max ${fmt(selected?.remainingAmount)}`}
                placeholderTextColor={COLORS.textMuted}
                value={payForm.amount}
                onChangeText={v => setPayForm(p => ({ ...p, amount: v }))}
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{lang === 'fr' ? 'Notes' : 'Notes'}</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder={lang === 'fr' ? 'Optionnel...' : 'Optional...'}
                placeholderTextColor={COLORS.textMuted}
                value={payForm.notes}
                onChangeText={v => setPayForm(p => ({ ...p, notes: v }))}
              />
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={handleAddPayment} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>{lang === 'fr' ? 'Créer & Envoyer lien' : 'Create & Send link'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, paddingTop: 52, paddingBottom: 16, paddingHorizontal: SPACING.md },
  backBtn: { padding: 4 },
  title: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full, padding: 6 },

  searchRow: { flexDirection: 'row', alignItems: 'center', margin: SPACING.md, backgroundColor: COLORS.white, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 10, elevation: 2 },
  searchInput: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textPrimary },

  filterScroll: { maxHeight: 44 },
  filterRow: { paddingHorizontal: SPACING.md, gap: 8, alignItems: 'center' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.border },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '600' },
  filterTextActive: { color: COLORS.white },

  list: { padding: SPACING.md, gap: 10 },

  card: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, elevation: 2, gap: SPACING.md },
  cardLeft: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 4 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  cardCode: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.primary, backgroundColor: COLORS.primaryGlow, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  cardAmount: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  cardRemaining: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  cardBank: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },

  progressBg: { height: 5, backgroundColor: COLORS.border, borderRadius: 3, marginVertical: 4 },
  progressFill: { height: 5, borderRadius: 3 },

  alertDot: { backgroundColor: '#fef3c7', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  alertDotText: { fontSize: 10, fontWeight: '700', color: '#d97706' },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: FONTS.sizes.md, color: COLORS.textMuted },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.lg },
  emptyBtnText: { color: COLORS.white, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.textPrimary },

  fieldGroup: { marginBottom: SPACING.md },
  fieldLabel: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInputLarge: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  fieldInput: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: FONTS.sizes.md, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border },

  currencyRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  currencyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.border },
  currencyBtnActive: { backgroundColor: COLORS.primary },
  currencyText: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  currencyTextActive: { color: COLORS.white },

  submitBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.md },
  submitText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md },

  summaryBox: { backgroundColor: COLORS.background, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  summaryValue: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  detailLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600' },
  detailValue: { fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, fontWeight: '500', flex: 1, textAlign: 'right' },

  paymentsSection: { marginTop: SPACING.md, marginBottom: SPACING.sm },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  paymentDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  paymentCode: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary },
  paymentAmount: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary },
  payLinkBtns: { flexDirection: 'row', gap: 6 },
  payIconBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryGlow },

  receiptOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  receiptClose: { position: 'absolute', top: 52, right: 20, zIndex: 10 },
  receiptImage: { width: SCREEN_W, height: SCREEN_H * 0.8 },

  addPayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, marginTop: SPACING.md },
  addPayBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.sm },

  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginTop: SPACING.sm },
  cancelBtnText: { fontSize: FONTS.sizes.sm, color: COLORS.danger, fontWeight: '600' },

  remainingHint: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e0f2fe', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md },
  remainingHintText: { fontSize: FONTS.sizes.sm, color: '#0369a1', fontWeight: '600' },

  calcRow: { flexDirection: 'row', marginBottom: SPACING.md },
  calcResult: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e6f4ef', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.primary },
  calcResultText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, flex: 1 },
  calcResultAmount: { fontWeight: '700', color: COLORS.primary, fontSize: FONTS.sizes.md },

  clientSelected: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.successLight, borderRadius: RADIUS.md, padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.primary },
  clientSelectedAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  clientSelectedAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.md },
  clientSelectedName: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textPrimary },
  clientSelectedPhone: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  clientDropdown: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginTop: 4, elevation: 4, zIndex: 100 },
  clientDropdownItem: { paddingHorizontal: SPACING.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  clientDropdownName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  clientDropdownPhone: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  newClientBox: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary + '44', padding: SPACING.md, marginTop: 8 },
});
