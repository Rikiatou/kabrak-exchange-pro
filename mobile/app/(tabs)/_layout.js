import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import useLanguageStore from '../../src/store/languageStore';

const ACTIVE = '#0B6E4F';
const INACTIVE = '#94a3b8';
const BG = '#ffffff';

function TabIcon({ name, nameActive, focused, label }) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
        <Ionicons name={focused ? nameActive : name} size={20} color={focused ? ACTIVE : INACTIVE} />
      </View>
      <Text style={[styles.tabLabel, { color: focused ? ACTIVE : INACTIVE }]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useLanguageStore();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarShowLabel: false }}>
      <Tabs.Screen
        name="dashboard"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="grid-outline" nameActive="grid" focused={focused} label={t.tabs.dashboard} /> }}
      />
      <Tabs.Screen
        name="clients"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="people-outline" nameActive="people" focused={focused} label={t.tabs.clients} /> }}
      />
      <Tabs.Screen
        name="transactions"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="swap-horizontal-outline" nameActive="swap-horizontal" focused={focused} label={t.tabs.transactions} /> }}
      />
      <Tabs.Screen
        name="currencies"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="cash-outline" nameActive="cash" focused={focused} label={t.tabs.currencies} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="menu-outline" nameActive="menu" focused={focused} label={t.tabs.more} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60, backgroundColor: BG,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    paddingBottom: 4, paddingTop: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 16
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabIconWrap: {
    width: 40, height: 30, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center'
  },
  tabIconWrapActive: { backgroundColor: 'rgba(11,110,79,0.1)' },
  tabLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.1 }
});
