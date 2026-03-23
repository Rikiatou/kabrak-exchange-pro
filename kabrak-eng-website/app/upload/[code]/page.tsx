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
    webviewWarning: '⚠️ Vous êtes dans le navigateur WhatsApp',
    webviewSub: 'Pour ajouter à l\'écran d\'accueil, vous devez ouvrir ce lien dans Safari.',
    webviewBtn: '🧭 Ouvrir dans Safari',
    webviewStep: 'Appuyez sur les 3 points ··· en bas → "Ouvrir dans Safari"',
    installTitle: '📲 Accès rapide depuis votre écran d\'accueil',
    installSub: 'Retrouvez cette page en 1 tap — sans chercher le lien',
    installBtn: 'Voir comment installer →',
    installClose: 'Fermer le guide',
    iosTitle: '🍎 Sur iPhone (Safari)',
    iosSteps: [
      { icon: '0️⃣', text: 'Ouvrez ce lien dans Safari', sub: 'Dans WhatsApp : appuyez sur ··· en bas → "Ouvrir dans Safari"' },
      { icon: '1️⃣', text: 'Appuyez sur le bouton Partager', sub: '(icône carrée avec une flèche ↑ en bas de l\'écran)' },
      { icon: '2️⃣', text: 'Faites défiler et appuyez sur', sub: '"Sur l\'écran d\'accueil"' },
      { icon: '3️⃣', text: 'Appuyez sur « Ajouter »', sub: 'en haut à droite — c\'est fait !' },
    ],
    androidTitle: '🤖 Sur Android (Chrome)',
    androidSteps: [
      { icon: '1️⃣', text: 'Appuyez sur le menu ⋮', sub: '(3 points en haut à droite de Chrome)' },
      { icon: '2️⃣', text: 'Appuyez sur', sub: '"Ajouter à l\'écran d\'accueil"' },
      { icon: '3️⃣', text: 'Appuyez sur « Ajouter »', sub: 'dans la fenêtre qui apparaît' },
    ],
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
    webviewWarning: '⚠️ You are in the WhatsApp browser',
    webviewSub: 'To add to your home screen, you need to open this link in Safari.',
    webviewBtn: '🧭 Open in Safari',
    webviewStep: 'Tap the 3 dots ··· at the bottom → "Open in Safari"',
    installTitle: '📲 Quick access from your home screen',
    installSub: 'Find this page in 1 tap — no need to search for the link',
    installBtn: 'See how to install →',
    installClose: 'Close guide',
    iosTitle: '🍎 On iPhone (Safari)',
    iosSteps: [
      { icon: '0️⃣', text: 'Open this link in Safari first', sub: 'In WhatsApp: tap ··· at the bottom → "Open in Safari"' },
      { icon: '1️⃣', text: 'Tap the Share button', sub: '(square icon with arrow ↑ at the bottom of the screen)' },
      { icon: '2️⃣', text: 'Scroll down and tap', sub: '"Add to Home Screen"' },
      { icon: '3️⃣', text: 'Tap "Add"', sub: 'in the top right — done!' },
    ],
    androidTitle: '🤖 On Android (Chrome)',
    androidSteps: [
      { icon: '1️⃣', text: 'Tap the menu ⋮', sub: '(3 dots in top right of Chrome)' },
      { icon: '2️⃣', text: 'Tap', sub: '"Add to Home Screen"' },
      { icon: '3️⃣', text: 'Tap "Add"', sub: 'in the popup that appears' },
    ],
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
  const [showGuide, setShowGuide] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'other'>('other');
  const [isIOSWebView, setIsIOSWebView] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const t = T[lang];

  // Register service worker + store current URL for iOS PWA redirect
  useEffect(() => {
    const currentUrl = window.location.href;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (('standalone' in navigator) && (navigator as any).standalone === true);
    if (isStandalone) setShowBanner(false);

    // Stocker l'URL dans localStorage (fallback fiable si SW tué par iOS)
    try {
      localStorage.setItem('kabrak_upload_url', currentUrl);
      localStorage.setItem('kabrak_upload_code', code);
    } catch (_) {}

    // Détecter le type d'appareil pour afficher le bon guide
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isSafariProper = isIOS && /Version\//.test(ua) && /Safari\//.test(ua);
    const webview = isIOS && !isSafariProper; // WhatsApp, Instagram, etc.
    if (isIOS) setDeviceType('ios');
    else if (/Android/.test(ua)) setDeviceType('android');
    else setDeviceType('other');
    setIsIOSWebView(webview);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        const sw = reg.installing || reg.waiting || reg.active;
        const send = (s: ServiceWorker) => s.postMessage({ type: 'STORE_URL', url: currentUrl });
        if (reg.active) {
          send(reg.active);
        } else if (sw) {
          sw.addEventListener('statechange', () => {
            if (sw.state === 'activated') send(sw);
          });
        }
      }).catch(() => {});
    }
  }, []);

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

      {/* iOS WebView warning — doit ouvrir dans Safari */}
      {isIOSWebView && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10001,
          background: 'linear-gradient(135deg, #7c2d12, #991b1b)',
          padding: '16px 16px 20px',
          boxShadow: '0 4px 30px rgba(0,0,0,0.8)',
        }}>
          <p style={{ color: 'white', fontWeight: 800, fontSize: 15, margin: '0 0 4px' }}>{t.webviewWarning}</p>
          <p style={{ color: '#fca5a5', fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 }}>{t.webviewSub}</p>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
            <p style={{ color: '#fed7aa', fontSize: 13, margin: 0, lineHeight: 1.6 }}>👉 {t.webviewStep}</p>
          </div>
          <a
            href={typeof window !== 'undefined' ? window.location.href : '#'}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block', width: '100%', padding: '12px',
              background: 'white', color: '#991b1b',
              fontWeight: 800, fontSize: 14, textAlign: 'center',
              borderRadius: 12, textDecoration: 'none', boxSizing: 'border-box',
            }}
          >
            {t.webviewBtn}
          </a>
        </div>
      )}

      {/* Install banner */}
      {showBanner && (
        <>
          {/* Guide modal overlay */}
          {showGuide && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end',
            }} onClick={() => setShowGuide(false)}>
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  width: '100%', background: '#0a1f15',
                  borderRadius: '24px 24px 0 0', padding: '24px 20px 48px',
                  border: '1px solid rgba(11,110,79,0.4)',
                  maxHeight: '85vh', overflowY: 'auto',
                }}
              >
                <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 20px' }} />

                {/* iOS steps */}
                {(deviceType === 'ios' || deviceType === 'other') && (
                  <div style={{ marginBottom: deviceType === 'other' ? 28 : 0 }}>
                    <p style={{ color: '#e8a020', fontWeight: 800, fontSize: 16, margin: '0 0 16px' }}>{t.iosTitle}</p>
                    {t.iosSteps.map((step, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                        background: 'rgba(255,255,255,0.04)', borderRadius: 14,
                        padding: '14px 16px', marginBottom: 10,
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}>
                        <span style={{ fontSize: 22, lineHeight: 1 }}>{step.icon}</span>
                        <div>
                          <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>{step.text}</p>
                          <p style={{ color: '#86efac', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{step.sub}</p>
                        </div>
                      </div>
                    ))}
                    {/* Visual hint for iOS share button */}
                    {deviceType === 'ios' && (
                      <div style={{ background: 'rgba(11,110,79,0.15)', border: '1px solid rgba(11,110,79,0.3)', borderRadius: 12, padding: '12px 16px', marginTop: 8, textAlign: 'center' }}>
                        <p style={{ color: '#4ade80', fontSize: 13, margin: 0 }}>💡 Le bouton Partager ressemble à : <strong style={{ fontSize: 18 }}>⎙</strong> (carré avec flèche vers le haut)</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Divider for 'other' devices */}
                {deviceType === 'other' && (
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0 24px' }} />
                )}

                {/* Android steps */}
                {(deviceType === 'android' || deviceType === 'other') && (
                  <div>
                    <p style={{ color: '#86efac', fontWeight: 800, fontSize: 16, margin: '0 0 16px' }}>{t.androidTitle}</p>
                    {t.androidSteps.map((step, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                        background: 'rgba(255,255,255,0.04)', borderRadius: 14,
                        padding: '14px 16px', marginBottom: 10,
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}>
                        <span style={{ fontSize: 22, lineHeight: 1 }}>{step.icon}</span>
                        <div>
                          <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>{step.text}</p>
                          <p style={{ color: '#86efac', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{step.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => { setShowGuide(false); setShowBanner(false); }}
                  style={{ width: '100%', marginTop: 20, padding: '14px', borderRadius: 14, background: '#0B6E4F', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}
                >
                  ✅ {t.installClose}
                </button>
              </div>
            </div>
          )}

          {/* Bottom banner */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
            background: 'linear-gradient(135deg, #0a2d1a, #0f3d24)',
            borderTop: '2px solid #0B6E4F',
            padding: '14px 16px 32px',
            boxShadow: '0 -6px 40px rgba(0,0,0,0.8)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 28 }}>📲</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 15, margin: 0 }}>{t.installTitle}</p>
                <p style={{ color: '#86efac', fontSize: 12, margin: '2px 0 0', opacity: 0.9 }}>{t.installSub}</p>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer', padding: '6px 10px', borderRadius: 8, flexShrink: 0 }}
              >✕</button>
            </div>
            <button
              onClick={() => setShowGuide(true)}
              style={{
                width: '100%', padding: '13px', borderRadius: 14,
                background: '#0B6E4F', color: 'white',
                fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(11,110,79,0.5)',
              }}
            >
              {t.installBtn}
            </button>
          </div>
        </>
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
