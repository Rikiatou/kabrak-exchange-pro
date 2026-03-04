import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GREEN = '#0B6E4F';
const GOLD = '#e8a020';
const CHECKLIST_DISMISSED_KEY = 'kabrak_checklist_dismissed';

const STEPS_FR = [
  { key: 'account', icon: 'checkmark-circle', label: 'Créer un compte', always: true },
  { key: 'settings', icon: 'settings-outline', label: 'Configurer votre business', route: '/settings/business' },
  { key: 'currencies', icon: 'cash-outline', label: 'Ajouter vos devises', route: '/(tabs)/currencies' },
  { key: 'client', icon: 'person-add-outline', label: 'Ajouter un client', route: '/clients/new' },
  { key: 'transaction', icon: 'swap-horizontal-outline', label: 'Faire votre 1ère transaction', route: '/transactions/new' },
  { key: 'team', icon: 'people-outline', label: 'Inviter un employé (optionnel)', route: '/settings/team' },
];

const STEPS_EN = [
  { key: 'account', icon: 'checkmark-circle', label: 'Create an account', always: true },
  { key: 'settings', icon: 'settings-outline', label: 'Set up your business', route: '/settings/business' },
  { key: 'currencies', icon: 'cash-outline', label: 'Add your currencies', route: '/(tabs)/currencies' },
  { key: 'client', icon: 'person-add-outline', label: 'Add a client', route: '/clients/new' },
  { key: 'transaction', icon: 'swap-horizontal-outline', label: 'Make your 1st transaction', route: '/transactions/new' },
  { key: 'team', icon: 'people-outline', label: 'Invite an employee (optional)', route: '/settings/team' },
];

export default function StartupChecklist({ data, settings, lang = 'fr' }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CHECKLIST_DISMISSED_KEY).then(val => setDismissed(val === 'true'));
  }, []);

  if (dismissed === null || dismissed === true) return null;

  const steps = lang === 'fr' ? STEPS_FR : STEPS_EN;
  const s = data?.summary || {};

  const completedKeys = new Set(['account']);
  if (settings?.businessName) completedKeys.add('settings');
  if (data?.currencies?.length > 0) completedKeys.add('currencies');
  if ((s.totalTransactions || 0) > 0) completedKeys.add('transaction');
  if (data?.debtorClients?.length > 0 || (s.totalTransactions || 0) > 0) completedKeys.add('client');

  const completedCount = steps.filter(st => completedKeys.has(st.key)).length;
  const allDone = completedCount >= 5;

  if (allDone) {
    AsyncStorage.setItem(CHECKLIST_DISMISSED_KEY, 'true');
    return null;
  }

  const progress = completedCount / steps.length;

  const handleDismiss = () => {
    AsyncStorage.setItem(CHECKLIST_DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <View style={st.wrap}>
      <TouchableOpacity style={st.header} onPress={() => setCollapsed(!collapsed)} activeOpacity={0.8}>
        <View style={st.headerLeft}>
          <View style={st.rocketBox}>
            <Text style={{ fontSize: 18 }}>🚀</Text>
          </View>
          <View>
            <Text style={st.title}>{lang === 'fr' ? 'Démarrage rapide' : 'Quick Start'}</Text>
            <Text style={st.sub}>{completedCount}/{steps.length} {lang === 'fr' ? 'étapes' : 'steps'}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={16} color="#94a3b8" />
          </TouchableOpacity>
          <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={16} color="#94a3b8" />
        </View>
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={st.progressTrack}>
        <View style={[st.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Steps */}
      {!collapsed && (
        <View style={st.stepsWrap}>
          {steps.map((step) => {
            const done = completedKeys.has(step.key);
            return (
              <TouchableOpacity
                key={step.key}
                style={st.stepRow}
                onPress={() => !done && step.route && router.push(step.route)}
                activeOpacity={done ? 1 : 0.7}
                disabled={done || !step.route}
              >
                <View style={[st.checkCircle, done && st.checkCircleDone]}>
                  {done ? (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  ) : (
                    <View style={st.checkEmpty} />
                  )}
                </View>
                <Text style={[st.stepLabel, done && st.stepLabelDone]}>{step.label}</Text>
                {!done && step.route && (
                  <Ionicons name="chevron-forward" size={14} color="#94a3b8" style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    marginHorizontal: 16, marginTop: 12, backgroundColor: '#fff',
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4,
    borderWidth: 1, borderColor: `${GREEN}20`,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rocketBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: `${GOLD}15`, justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  sub: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 1 },
  progressTrack: {
    height: 4, backgroundColor: '#f1f5f9', marginHorizontal: 16, borderRadius: 2,
  },
  progressFill: {
    height: 4, backgroundColor: GREEN, borderRadius: 2,
  },
  stepsWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 10,
  },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center',
  },
  checkCircleDone: {
    backgroundColor: GREEN, borderColor: GREEN,
  },
  checkEmpty: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e2e8f0' },
  stepLabel: { fontSize: 13, color: '#334155', fontWeight: '600', flex: 1 },
  stepLabelDone: { color: '#94a3b8', textDecorationLine: 'line-through' },
});
