'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PwaEntryPage() {
  const params = useParams();
  const code = (params?.code as string || '').toUpperCase();
  const [isStandalone, setIsStandalone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (('standalone' in navigator) && (navigator as any).standalone === true);
    setIsStandalone(standalone);
    if (standalone && code) {
      window.location.replace(`/client/${code}`);
    } else {
      setReady(true);
    }
  }, [code]);

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: '#071a12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💱</div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>KABRAK Exchange Pro</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#071a12', color: 'white', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>📲</div>
      <h1 style={{ fontWeight: 900, fontSize: 22, textAlign: 'center', margin: '0 0 8px' }}>
        Installer votre portail
      </h1>
      <p style={{ color: '#86efac', fontSize: 14, textAlign: 'center', margin: '0 0 32px' }}>
        Code client : <strong>{code}</strong>
      </p>

      <div style={{ width: '100%', maxWidth: 400 }}>
        {[
          { n: '1', icon: '⬆️', title: 'Appuyez sur le bouton Partager', sub: 'En bas de Safari (icône carré avec flèche)' },
          { n: '2', icon: '➕', title: 'Sur l\'écran d\'accueil', sub: 'Choisissez "Sur l\'écran d\'accueil"' },
          { n: '3', icon: '✅', title: 'Appuyez sur "Ajouter"', sub: 'L\'app s\'installe avec votre portail' },
        ].map((s) => (
          <div key={s.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px', marginBottom: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0B6E4F', color: 'white', fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</div>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>{s.icon} {s.title}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(232,160,32,0.1)', borderRadius: 12, border: '1px solid rgba(232,160,32,0.3)', width: '100%', maxWidth: 400 }}>
        <p style={{ color: '#e8a020', fontSize: 13, margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
          ⚠️ Vous devez être dans <strong>Safari</strong> pour installer.<br/>Pas dans WhatsApp ou un autre navigateur.
        </p>
      </div>

      <a href={`/client/${code}`} style={{ marginTop: 24, color: 'rgba(255,255,255,0.3)', fontSize: 13, textDecoration: 'underline' }}>
        Accéder au portail sans installer
      </a>
    </div>
  );
}
