export const metadata = {
  title: 'Politique de Confidentialité — KABRAK Exchange Pro',
  description: 'Politique de confidentialité de KABRAK Exchange Pro par KABRAK ENG.',
};

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: '#080818', minHeight: '100vh', color: '#e2e8f0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <a href="https://kabrakeng.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" fill="none" stroke="#34d399" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </div>
            <span style={{ color: '#34d399', fontSize: 14, fontWeight: 600 }}>kabrakeng.com</span>
          </a>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 999, padding: '4px 14px', marginBottom: 20 }}>
            <svg width="12" height="12" fill="#34d399" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style={{ color: '#34d399', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Politique de confidentialité</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
            KABRAK Exchange Pro
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Dernière mise à jour : <strong style={{ color: '#94a3b8' }}>Mars 2026</strong> — KABRAK ENG, Douala, Cameroun
          </p>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 40 }}>

          <Section title="1. Introduction">
            <p>KABRAK ENG (&quot;nous&quot;, &quot;notre&quot;) développe et opère l&apos;application <strong>KABRAK Exchange Pro</strong>, une solution de gestion pour bureaux de change. Cette politique explique comment nous collectons, utilisons et protégeons vos données personnelles lors de l&apos;utilisation de notre application mobile (Android / iOS) et de nos services associés.</p>
          </Section>

          <Section title="2. Données collectées">
            <p style={{ marginBottom: 12 }}>Nous collectons les données suivantes :</p>
            <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#94a3b8' }}>
              <li><strong style={{ color: '#e2e8f0' }}>Données de compte :</strong> nom, prénom, adresse email, mot de passe (chiffré), nom de l&apos;entreprise</li>
              <li><strong style={{ color: '#e2e8f0' }}>Données financières :</strong> transactions de change (montants, devises, taux), paiements, créances clients</li>
              <li><strong style={{ color: '#e2e8f0' }}>Données clients :</strong> nom, téléphone, email des clients de votre bureau de change</li>
              <li><strong style={{ color: '#e2e8f0' }}>Données d&apos;équipe :</strong> emails et rôles des employés ajoutés à votre compte</li>
              <li><strong style={{ color: '#e2e8f0' }}>Données techniques :</strong> token de notification push, logs d&apos;utilisation (sans données personnelles)</li>
            </ul>
          </Section>

          <Section title="3. Utilisation des données">
            <p style={{ marginBottom: 12 }}>Vos données sont utilisées exclusivement pour :</p>
            <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#94a3b8' }}>
              <li>Fournir les fonctionnalités de l&apos;application (gestion des transactions, rapports, reçus)</li>
              <li>Authentifier votre compte et sécuriser votre accès</li>
              <li>Envoyer des notifications liées à votre activité (paiements, rappels)</li>
              <li>Améliorer nos services et corriger les bugs</li>
              <li>Gérer votre licence d&apos;utilisation</li>
            </ul>
            <p style={{ marginTop: 12 }}>Nous ne vendons, ne louons et ne partageons jamais vos données avec des tiers à des fins commerciales.</p>
          </Section>

          <Section title="4. Stockage et sécurité">
            <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#94a3b8' }}>
              <li>Vos données sont stockées sur des serveurs sécurisés hébergés par <strong style={{ color: '#e2e8f0' }}>Railway</strong> (infrastructure cloud)</li>
              <li>Les mots de passe sont chiffrés avec <strong style={{ color: '#e2e8f0' }}>bcrypt</strong></li>
              <li>Les communications sont chiffrées via <strong style={{ color: '#e2e8f0' }}>HTTPS/TLS</strong></li>
              <li>Les tokens d&apos;authentification sont stockés dans le <strong style={{ color: '#e2e8f0' }}>Secure Store</strong> de votre appareil</li>
              <li>L&apos;accès aux données est restreint par des rôles (Owner, Manager, Caissier)</li>
            </ul>
          </Section>

          <Section title="5. Données hors-ligne">
            <p>L&apos;application fonctionne en mode hors-ligne. Dans ce cas, vos données sont temporairement stockées localement sur votre appareil (AsyncStorage chiffré) et synchronisées avec nos serveurs dès que la connexion est rétablie.</p>
          </Section>

          <Section title="6. Vos droits">
            <p style={{ marginBottom: 12 }}>Conformément aux lois applicables sur la protection des données, vous disposez des droits suivants :</p>
            <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#94a3b8' }}>
              <li><strong style={{ color: '#e2e8f0' }}>Accès :</strong> obtenir une copie de vos données</li>
              <li><strong style={{ color: '#e2e8f0' }}>Rectification :</strong> corriger vos données inexactes</li>
              <li><strong style={{ color: '#e2e8f0' }}>Suppression :</strong> demander la suppression de votre compte et de vos données</li>
              <li><strong style={{ color: '#e2e8f0' }}>Portabilité :</strong> recevoir vos données dans un format structuré</li>
            </ul>
            <p style={{ marginTop: 12 }}>Pour exercer ces droits, contactez-nous à <a href="mailto:kabrakeng@gmail.com" style={{ color: '#34d399' }}>kabrakeng@gmail.com</a></p>
          </Section>

          <Section title="7. Suppression de données">
            <p>Pour supprimer votre compte et toutes les données associées, envoyez un email à <a href="mailto:kabrakeng@gmail.com" style={{ color: '#34d399' }}>kabrakeng@gmail.com</a> avec l&apos;objet &quot;Suppression de compte&quot;. Nous traitons les demandes sous <strong>30 jours</strong>.</p>
            <p style={{ marginTop: 8 }}>Vous pouvez aussi consulter notre <a href="/data-deletion" style={{ color: '#34d399' }}>page de suppression de données</a>.</p>
          </Section>

          <Section title="8. Notifications push">
            <p>L&apos;application peut envoyer des notifications push via <strong>Expo Notifications</strong>. Ces notifications sont liées à votre activité (ex : rappel de paiement). Vous pouvez les désactiver à tout moment dans les paramètres de votre appareil.</p>
          </Section>

          <Section title="9. Modifications">
            <p>Nous pouvons mettre à jour cette politique. En cas de modification importante, nous vous en informerons via l&apos;application. La date de dernière mise à jour est indiquée en haut de cette page.</p>
          </Section>

          <Section title="10. Contact">
            <p>Pour toute question concernant cette politique :</p>
            <div style={{ marginTop: 16, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 12, padding: '16px 20px' }}>
              <p style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 4 }}>KABRAK ENG</p>
              <p style={{ color: '#94a3b8', fontSize: 14 }}>Douala, Cameroun</p>
              <p style={{ fontSize: 14, marginTop: 8 }}>
                <a href="mailto:kabrakeng@gmail.com" style={{ color: '#34d399' }}>kabrakeng@gmail.com</a>
              </p>
              <p style={{ fontSize: 14, marginTop: 4 }}>
                <a href="https://wa.me/237653561862" style={{ color: '#34d399' }}>+237 653 561 862</a>
              </p>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ color: '#475569', fontSize: 13 }}>© {new Date().getFullYear()} KABRAK ENG — Tous droits réservés</span>
          <span style={{ color: '#475569', fontSize: 13 }}>🇨🇲 Made in Cameroon</span>
        </div>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ display: 'inline-block', width: 3, height: 20, background: 'linear-gradient(180deg, #34d399, #0d9488)', borderRadius: 2 }} />
        {title}
      </h2>
      <div style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: 15 }}>
        {children}
      </div>
    </div>
  );
}
