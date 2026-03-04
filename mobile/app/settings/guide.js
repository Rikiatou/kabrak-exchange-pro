import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '../../src/constants/colors';
import useOnboardingStore from '../../src/store/onboardingStore';

const GREEN = '#0B6E4F';
const GOLD = '#e8a020';

const SECTIONS = [
  {
    title: 'Premiers pas',
    titleEn: 'Getting Started',
    icon: 'rocket-outline',
    color: GOLD,
    items: [
      {
        q: 'Comment commencer ?',
        qEn: 'How to get started?',
        a: '1. Allez dans Devises et ajoutez vos paires (EUR, USD, XOF...)\n2. Créez un client (onglet Clients → +)\n3. Faites votre 1ère transaction (onglet Transactions → +)\n4. Partagez le reçu par WhatsApp ou imprimez-le',
        aEn: '1. Go to Currencies and add your pairs (EUR, USD, XOF...)\n2. Create a client (Clients tab → +)\n3. Make your 1st transaction (Transactions tab → +)\n4. Share the receipt via WhatsApp or print it',
      },
      {
        q: 'Comment configurer mon business ?',
        qEn: 'How to set up my business?',
        a: 'Plus → Mon entreprise. Ajoutez votre nom, téléphone, adresse et logo. Ces infos apparaîtront sur vos reçus.',
        aEn: 'More → My business. Add your name, phone, address and logo. This info will appear on your receipts.',
      },
    ],
  },
  {
    title: 'Transactions',
    titleEn: 'Transactions',
    icon: 'swap-horizontal-outline',
    color: GREEN,
    items: [
      {
        q: 'Comment créer une transaction ?',
        qEn: 'How to create a transaction?',
        a: 'Dashboard → + ou Transactions → +.\nChoisissez le type (Achat/Vente), le client, les devises, le montant et le taux. Le total se calcule automatiquement.',
        aEn: 'Dashboard → + or Transactions → +.\nChoose the type (Buy/Sell), client, currencies, amount and rate. The total is calculated automatically.',
      },
      {
        q: 'Comment enregistrer un paiement partiel ?',
        qEn: 'How to record a partial payment?',
        a: 'Ouvrez la transaction → Ajouter un paiement. Le statut passera automatiquement de "Non payé" à "Partiel" puis "Payé".',
        aEn: 'Open the transaction → Add payment. The status will automatically change from "Unpaid" to "Partial" then "Paid".',
      },
      {
        q: 'Comment partager un reçu ?',
        qEn: 'How to share a receipt?',
        a: 'Après une transaction, appuyez sur le bouton Partager (icône partage). Vous pouvez envoyer par WhatsApp, Email ou imprimer le PDF.',
        aEn: 'After a transaction, tap the Share button (share icon). You can send via WhatsApp, Email or print the PDF.',
      },
    ],
  },
  {
    title: 'Dépôts',
    titleEn: 'Deposits',
    icon: 'wallet-outline',
    color: '#8b5cf6',
    items: [
      {
        q: 'Comment fonctionne le système de dépôt ?',
        qEn: 'How does the deposit system work?',
        a: '1. Créez une commande de dépôt (montant + client)\n2. Un code unique est généré (ex: TD-XXXX)\n3. Envoyez le code et le lien au client par WhatsApp\n4. Le client upload son reçu de paiement\n5. Vous vérifiez (œil 👁) et confirmez ✓ ou rejetez ✗',
        aEn: '1. Create a deposit order (amount + client)\n2. A unique code is generated (e.g. TD-XXXX)\n3. Send the code and link to the client via WhatsApp\n4. The client uploads their payment receipt\n5. You verify (eye 👁) and confirm ✓ or reject ✗',
      },
      {
        q: 'Où voir les reçus uploadés ?',
        qEn: 'Where to see uploaded receipts?',
        a: 'Plus → Galerie des reçus. Vous y trouvez tous les reçus uploadés par vos clients, classés par nom.',
        aEn: 'More → Receipt Gallery. You\'ll find all receipts uploaded by your clients, sorted by name.',
      },
    ],
  },
  {
    title: 'Rapports & Profit',
    titleEn: 'Reports & Profit',
    icon: 'bar-chart-outline',
    color: '#f59e0b',
    items: [
      {
        q: 'Comment voir mon profit ?',
        qEn: 'How to see my profit?',
        a: 'Le Dashboard affiche votre profit réel (marge sur les taux) pour aujourd\'hui, cette semaine et ce mois. Le profit est calculé automatiquement sur chaque transaction.',
        aEn: 'The Dashboard shows your real profit (rate margin) for today, this week and this month. Profit is calculated automatically on each transaction.',
      },
      {
        q: 'Comment exporter mes données ?',
        qEn: 'How to export my data?',
        a: 'Dashboard → Export Excel (raccourci) ou Plus → Rapports. Vous pouvez exporter les transactions, versements et clients en fichier Excel.',
        aEn: 'Dashboard → Export Excel (shortcut) or More → Reports. You can export transactions, deposits and clients as Excel files.',
      },
    ],
  },
  {
    title: 'Équipe & Sécurité',
    titleEn: 'Team & Security',
    icon: 'shield-checkmark-outline',
    color: '#6366f1',
    items: [
      {
        q: 'Comment ajouter un employé ?',
        qEn: 'How to add an employee?',
        a: 'Plus → Mon Équipe → Inviter. Créez un compte employé (email + mot de passe). Il pourra se connecter avec votre licence. Les rôles disponibles : Manager (accès complet) ou Caissier (transactions seulement).',
        aEn: 'More → My Team → Invite. Create an employee account (email + password). They can log in with your license. Available roles: Manager (full access) or Cashier (transactions only).',
      },
      {
        q: 'Comment changer mon mot de passe ?',
        qEn: 'How to change my password?',
        a: 'Plus → Changer le mot de passe. Entrez votre ancien mot de passe puis le nouveau (minimum 6 caractères).',
        aEn: 'More → Change password. Enter your old password then the new one (minimum 6 characters).',
      },
    ],
  },
];

function FAQItem({ item, lang }) {
  const [open, setOpen] = useState(false);
  const q = lang === 'en' ? (item.qEn || item.q) : item.q;
  const a = lang === 'en' ? (item.aEn || item.a) : item.a;

  return (
    <TouchableOpacity style={st.faqItem} onPress={() => setOpen(!open)} activeOpacity={0.7}>
      <View style={st.faqHead}>
        <Text style={st.faqQ}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
      </View>
      {open && <Text style={st.faqA}>{a}</Text>}
    </TouchableOpacity>
  );
}

export default function GuideScreen() {
  const router = useRouter();
  const { resetOnboarding } = useOnboardingStore();
  const lang = 'fr';

  return (
    <View style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>{lang === 'fr' ? "Guide d'utilisation" : 'User Guide'}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Replay onboarding */}
        <TouchableOpacity
          style={st.replayCard}
          onPress={async () => { await resetOnboarding(); router.push('/(auth)/onboarding'); }}
          activeOpacity={0.8}
        >
          <View style={st.replayIcon}>
            <Ionicons name="play-circle" size={28} color={GOLD} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.replayTitle}>{lang === 'fr' ? 'Revoir le tutoriel' : 'Replay tutorial'}</Text>
            <Text style={st.replaySub}>{lang === 'fr' ? 'Revoyez les slides d\'introduction' : 'Review the intro slides'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* FAQ Sections */}
        {SECTIONS.map((section, i) => (
          <View key={i} style={st.section}>
            <View style={st.sectionHead}>
              <View style={[st.sectionIcon, { backgroundColor: `${section.color}15` }]}>
                <Ionicons name={section.icon} size={18} color={section.color} />
              </View>
              <Text style={st.sectionTitle}>{lang === 'en' ? (section.titleEn || section.title) : section.title}</Text>
            </View>
            <View style={st.sectionCard}>
              {section.items.map((item, j) => (
                <FAQItem key={j} item={item} lang={lang} />
              ))}
            </View>
          </View>
        ))}

        {/* Contact support */}
        <View style={st.supportCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={GREEN} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={st.supportTitle}>{lang === 'fr' ? 'Besoin d\'aide ?' : 'Need help?'}</Text>
            <Text style={st.supportSub}>kabrakeng@gmail.com</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingTop: 56, paddingBottom: SPACING.lg,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.white },
  replayCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff',
    borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: `${GOLD}20`,
  },
  replayIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: `${GOLD}12`, justifyContent: 'center', alignItems: 'center',
  },
  replayTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  replaySub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionIcon: {
    width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  faqItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  faqHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontSize: 13, fontWeight: '700', color: '#334155', flex: 1, marginRight: 8 },
  faqA: { fontSize: 12, color: '#64748b', lineHeight: 20, marginTop: 10, paddingLeft: 2 },
  supportCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 24, backgroundColor: `${GREEN}08`,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: `${GREEN}15`,
  },
  supportTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  supportSub: { fontSize: 12, color: GREEN, fontWeight: '600', marginTop: 2 },
});
