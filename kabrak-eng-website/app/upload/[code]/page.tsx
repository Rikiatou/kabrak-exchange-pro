'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

const API = 'https://kabrak-exchange-pro-production.up.railway.app';

type Lang = 'fr' | 'en';

const T = {
  fr: {
    loading: 'Chargement...',
    notFound: 'Code invalide ou expiré.',
    title: 'Uploader votre reçu',
    subtitle: 'Prenez une photo ou sélectionnez votre reçu de dépôt bancaire.',
    amount: 'Montant',
    bank: 'Banque',
    ref: 'Référence',
    chooseFile: 'Choisir depuis la galerie',
    takePhoto: 'Prendre une photo',
    changeFile: 'Changer le fichier',
    send: 'Envoyer le reçu',
    sending: 'Envoi en cours...',
    success: 'Reçu envoyé avec succès !',
    successSub: "L'opérateur a été notifié et va vérifier votre reçu. Vous pouvez fermer cette page.",
    error: "Erreur lors de l'envoi. Veuillez réessayer.",
    fileRequired: 'Veuillez sélectionner un fichier.',
    maxSize: 'Fichier trop volumineux (max 10 MB).',
    installTitle: 'Installer sur votre téléphone',
    installIos: '↑ iPhone : appuyez sur le bouton Partager puis "Sur l\'écran d\'accueil"',
    installAndroid: 'Android : menu ⋮ puis "Ajouter à l\'écran d\'accueil"',
  },
  en: {
    loading: 'Loading...',
    notFound: 'Invalid or expired code.',
    title: 'Upload your receipt',
    subtitle: 'Take a photo or select your bank deposit receipt.',
    amount: 'Amount',
    bank: 'Bank',
    ref: 'Reference',
    chooseFile: 'Choose from gallery',
    takePhoto: 'Take a photo',
    changeFile: 'Change file',
    send: 'Send receipt',
    sending: 'Sending...',
    success: 'Receipt sent successfully!',
    successSub: 'The operator has been notified and will verify your receipt. You can close this page.',
    error: 'Error sending. Please try again.',
    fileRequired: 'Please select a file.',
    maxSize: 'File too large (max 10 MB).',
    installTitle: 'Install on your phone',
    installIos: '↑ iPhone: tap the Share button then "Add to Home Screen"',
    installAndroid: 'Android: menu ⋮ then "Add to Home Screen"',
  },
};

export default function UploadPage() {
  const params = useParams();
  const code = ((params.code as string) || '').toUpperCase();
  const [lang, setLang] = useState<Lang>('fr');
  const [deposit, setDeposit] = useState<any>(null);
  const [loadError, setLoadError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [businessName, setBusinessName] = useState('KABRAK Exchange Pro');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showBanner, setShowBanner] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const t = T[lang];

  // Hide banner if already in standalone mode (installed)
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (('standalone' in navigator) && (navigator as any).standalone === true);
    if (isStandalone) setShowBanner(false);
  }, []);

  // iOS PWA meta tags — blob manifests are NOT supported on Safari iOS
  // We inject apple-specific meta tags so that "Add to Home Screen" opens this exact URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentUrl = window.location.href;
    document.title = `Versement — ${businessName}`;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    const setMetaProp = (prop: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${prop}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
      el.content = content;
    };

    // Apple PWA meta tags (iOS reads these for Add to Home Screen)
    setMeta('apple-mobile-web-app-capable', 'yes');
    setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    setMeta('apple-mobile-web-app-title', `Versement — ${businessName}`);
    setMeta('theme-color', '#0B6E4F');

    // Dynamic manifest via API route with the current URL encoded
    const encoded = encodeURIComponent(currentUrl);
    const name = encodeURIComponent(`Versement — ${businessName}`);
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) { link = document.createElement('link'); link.rel = 'manifest'; document.head.appendChild(link); }
    link.href = `/api/manifest?start_url=${encoded}&name=${name}`;

    // Apple touch icon
    let iconLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!iconLink) { iconLink = document.createElement('link'); iconLink.rel = 'apple-touch-icon'; document.head.appendChild(iconLink); }
    iconLink.href = '/KEiconelogo.jpeg';
  }, [businessName]);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/deposits/public/${code}`).then(r => r.json()),
      fetch(`${API}/api/settings/public`).then(r => r.json()).catch(() => ({})),
    ]).then(([data, settings]) => {
      if (settings?.success && settings?.data?.businessName) setBusinessName(settings.data.businessName);
      if (data.success) setDeposit(data.data);
      else setLoadError(data.message || t.notFound);
    }).catch(() => setLoadError(t.notFound))
      .finally(() => setPageLoading(false));
  }, [code]);

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) { setErrorMsg(t.maxSize); return; }
    setFile(f);
    setErrorMsg('');
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else setPreview(null);
  };

  const handleSubmit = async () => {
    if (!file) { setErrorMsg(t.fileRequired); return; }
    setStatus('uploading');
    setErrorMsg('');
    const fd = new FormData();
    fd.append('receipt', file);
    try {
      const res = await fetch(`${API}/api/deposits/public/${code}/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) setStatus('success');
      else { setStatus('error'); setErrorMsg(data.message || t.error); }
    } catch {
      setStatus('error');
      setErrorMsg(t.error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#071a12', color: 'white', fontFamily: 'system-ui, sans-serif', padding: '24px 16px 100px' }}>

      {/* Install banner */}
      {showBanner && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
          background: '#0f2d1f', borderTop: '3px solid #0B6E4F',
          padding: '16px 16px 36px',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <div style={{ fontSize: 32 }}>📲</div>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'white', fontWeight: 800, fontSize: 16, margin: '0 0 8px' }}>
              {t.installTitle}
            </p>
            <p style={{ color: '#86efac', fontSize: 13, margin: '0 0 4px', lineHeight: 1.6 }}>
              {t.installIos}
            </p>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              {t.installAndroid}
            </p>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer', padding: '6px 12px', borderRadius: 8 }}
          >✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>💱</div>
        <div style={{ fontWeight: 800, fontSize: 22, color: 'white' }}>{businessName}</div>
        {/* Lang toggle */}
        <button
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          style={{ marginTop: 10, background: 'rgba(232,160,32,0.15)', color: '#e8a020', border: '1px solid rgba(232,160,32,0.3)', borderRadius: 8, padding: '5px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>

      {/* Card */}
      <div style={{ maxWidth: 480, margin: '0 auto', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 28 }}>

        {pageLoading && <p style={{ textAlign: 'center', color: '#94a3b8' }}>{t.loading}</p>}

        {!pageLoading && loadError && (
          <p style={{ textAlign: 'center', color: '#f87171', fontWeight: 600, padding: 24 }}>{loadError}</p>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: 'white', fontWeight: 800, fontSize: 20, marginBottom: 12 }}>{t.success}</h2>
            <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{t.successSub}</p>
          </div>
        )}

        {!pageLoading && !loadError && deposit && status !== 'success' && (
          <>
            <h1 style={{ color: 'white', fontWeight: 800, fontSize: 22, margin: '0 0 6px' }}>{t.title}</h1>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 20px' }}>{t.subtitle}</p>

            {/* Deposit info */}
            <div style={{ background: 'rgba(11,110,79,0.12)', border: '1px solid rgba(11,110,79,0.3)', borderRadius: 16, padding: 16, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{t.ref}</span>
                <span style={{ color: '#e8a020', fontWeight: 800, letterSpacing: 2 }}>{deposit.code}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Client</span>
                <span style={{ color: 'white', fontWeight: 600 }}>{deposit.clientName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{t.amount}</span>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>
                  {parseFloat(deposit.amount).toLocaleString('fr-FR')} {deposit.currency}
                </span>
              </div>
              {deposit.bank && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{t.bank}</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>{deposit.bank}</span>
                </div>
              )}
            </div>

            {/* File buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <button onClick={() => cameraRef.current?.click()} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, background: 'rgba(11,110,79,0.2)', border: '1px solid rgba(11,110,79,0.4)', color: '#4ade80', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                📷 {file ? t.changeFile : t.takePhoto}
              </button>
              <button onClick={() => inputRef.current?.click()} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, background: 'rgba(232,160,32,0.15)', border: '1px solid rgba(232,160,32,0.3)', color: '#e8a020', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                📁 {file ? t.changeFile : t.chooseFile}
              </button>
            </div>

            {/* Preview */}
            {preview && (
              <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 12, marginBottom: 16 }} />
            )}
            {file && !preview && (
              <p style={{ color: '#4ade80', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>📄 {file.name}</p>
            )}

            {errorMsg && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{errorMsg}</p>}

            <button
              onClick={handleSubmit}
              disabled={status === 'uploading'}
              style={{ width: '100%', padding: 16, borderRadius: 16, background: '#0B6E4F', color: 'white', fontWeight: 800, fontSize: 16, border: 'none', cursor: status === 'uploading' ? 'not-allowed' : 'pointer', opacity: status === 'uploading' ? 0.7 : 1 }}
            >
              {status === 'uploading' ? t.sending : `📤 ${t.send}`}
            </button>
          </>
        )}
      </div>

      <p style={{ color: '#334155', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
        {businessName} © {new Date().getFullYear()} — Powered by KABRAK Exchange Pro
      </p>
    </div>
  );
}
