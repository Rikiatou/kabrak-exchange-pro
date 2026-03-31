'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

const API = 'https://kabrak-exchange-pro-production.up.railway.app';

type Lang = 'fr' | 'en';

type PortalOrder = {
  id: string;
  reference: string;
  clientName: string;
  totalAmount: string | number;
  receivedAmount: string | number;
  remainingAmount: string | number;
  currency: string;
  bank?: string | null;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
  payments?: Array<{
    id: string;
    amount: string | number;
    currency: string;
    status: 'pending' | 'receipt_uploaded' | 'confirmed' | 'rejected';
    createdAt: string;
  }>;
};

const T = {
  fr: {
    loading: 'Chargement...',
    notFound: 'Code client invalide ou expiré.',
    title: 'Portail client',
    subtitle: 'Suivez vos commandes et envoyez vos reçus de paiement.',
    client: 'Client',
    amount: 'Montant total',
    paid: 'Total payé',
    remaining: 'Reste à payer',
    payments: 'Versements',
    noOrders: 'Aucune commande en cours.',
    noPayments: 'Aucun versement pour le moment.',
    addPayment: 'Ajouter un versement',
    amountToPay: 'Montant du versement *',
    amountPlaceholder: '200 000',
    notes: 'Notes (optionnel)',
    notesPlaceholder: 'Référence, commentaire...',
    chooseFile: 'Choisir un reçu',
    takePhoto: 'Prendre une photo',
    changeFile: 'Changer le fichier',
    send: 'Envoyer le versement',
    sending: 'Envoi en cours...',
    success: 'Versement envoyé avec succès !',
    successSub: 'Votre reçu a été transmis. Nous allons le vérifier rapidement.',
    error: 'Erreur lors de l\'envoi. Veuillez réessayer.',
    fileRequired: 'Veuillez sélectionner un reçu.',
    amountRequired: 'Veuillez entrer un montant valide.',
    maxSize: 'Fichier trop volumineux (max 10 MB).',
    status_pending: 'En attente',
    status_partial: 'Partiel',
    status_completed: 'Complété',
    status_cancelled: 'Annulé',
    pay_pending: 'En attente',
    pay_receipt_uploaded: 'Reçu envoyé',
    pay_confirmed: 'Confirmé',
    pay_rejected: 'Rejeté',
    webviewWarning: '⚠️ Ouvrez dans Safari pour continuer',
    webviewSub: 'Pour ajouter à l\'écran d\'accueil correctement, ce lien doit être ouvert dans Safari.',
    webviewBtn: '🧭 Ouvrir dans Safari',
    webviewStep: 'Dans WhatsApp : appuyez sur ··· en bas à droite → "Ouvrir dans Safari"',
    installTitle: '📲 Installer sur votre écran d\'accueil',
    installSub: '⚠️ Si vous êtes sur WhatsApp → ouvrez d\'abord dans Safari',
    installBtn: 'Voir le guide →',
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
    notFound: 'Invalid or expired client code.',
    title: 'Client portal',
    subtitle: 'Track your orders and upload your payment receipts.',
    client: 'Client',
    amount: 'Total amount',
    paid: 'Total paid',
    remaining: 'Remaining',
    payments: 'Payments',
    noOrders: 'No ongoing orders.',
    noPayments: 'No payments yet.',
    addPayment: 'Add payment',
    amountToPay: 'Payment amount *',
    amountPlaceholder: '200,000',
    notes: 'Notes (optional)',
    notesPlaceholder: 'Reference, comment...',
    chooseFile: 'Choose receipt',
    takePhoto: 'Take a photo',
    changeFile: 'Change file',
    send: 'Send payment',
    sending: 'Sending...',
    success: 'Payment sent successfully!',
    successSub: 'Your receipt has been sent. We will verify it shortly.',
    error: 'Error sending. Please try again.',
    fileRequired: 'Please select a receipt.',
    amountRequired: 'Please enter a valid amount.',
    maxSize: 'File too large (max 10 MB).',
    status_pending: 'Pending',
    status_partial: 'Partial',
    status_completed: 'Completed',
    status_cancelled: 'Cancelled',
    pay_pending: 'Pending',
    pay_receipt_uploaded: 'Receipt sent',
    pay_confirmed: 'Confirmed',
    pay_rejected: 'Rejected',
    webviewWarning: '⚠️ Open in Safari to continue',
    webviewSub: 'To correctly add to your home screen, this link must be opened in Safari.',
    webviewBtn: '🧭 Open in Safari',
    webviewStep: 'In WhatsApp: tap ··· at the bottom right → "Open in Safari"',
    installTitle: '📲 Install on your home screen',
    installSub: '⚠️ Using WhatsApp? Open in Safari first',
    installBtn: 'See the guide →',
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

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fef3c7', color: '#d97706' },
  partial: { bg: '#dbeafe', color: '#2563eb' },
  completed: { bg: '#dcfce7', color: '#0B6E4F' },
  cancelled: { bg: '#fee2e2', color: '#dc2626' },
  receipt_uploaded: { bg: '#dbeafe', color: '#2563eb' },
  confirmed: { bg: '#dcfce7', color: '#0B6E4F' },
  rejected: { bg: '#fee2e2', color: '#dc2626' },
};

function fmt(n: string | number) {
  const v = parseFloat(String(n || 0));
  return Number.isInteger(v)
    ? v.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
    : v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

export default function ClientPortalPage() {
  const params = useParams();
  const code = ((params.code as string) || '').toUpperCase();
  const [lang, setLang] = useState<Lang>('fr');
  const [businessName, setBusinessName] = useState('KABRAK Exchange Pro');
  const [client, setClient] = useState<any>(null);
  const [orders, setOrders] = useState<PortalOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PortalOrder | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
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

  const loadPortal = async () => {
    setPageLoading(true);
    try {
      const [portalRes, settingsRes] = await Promise.all([
        fetch(`${API}/api/public/client/${code}`).then(r => r.json()),
        fetch(`${API}/api/settings/public`).then(r => r.json()).catch(() => ({})),
      ]);
      if (settingsRes?.success && settingsRes?.data?.businessName) {
        setBusinessName(settingsRes.data.businessName);
      }
      if (!portalRes?.success) {
        setLoadError(portalRes?.message || t.notFound);
        return;
      }
      setClient(portalRes.data.client);
      setOrders(portalRes.data.orders || []);
      setSelectedOrder((portalRes.data.orders || []).find((o: PortalOrder) => ['pending', 'partial'].includes(o.status)) || null);
      setLoadError('');
    } catch {
      setLoadError(t.notFound);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    const currentUrl = window.location.href;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (('standalone' in navigator) && (navigator as any).standalone === true);
    if (isStandalone) setShowBanner(false);

    try {
      let portals: string[] = JSON.parse(localStorage.getItem('kabrak_portals') || '[]');
      portals = portals.filter((p: string) => p !== currentUrl);
      portals.unshift(currentUrl);
      portals = portals.slice(0, 5);
      localStorage.setItem('kabrak_portals', JSON.stringify(portals));
      localStorage.setItem('kabrak_portal_url', currentUrl);
      localStorage.setItem('kabrak_portal_code', code);
    } catch (_) {}

    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isInAppBrowser = /FBAN|FBAV|Instagram|WhatsApp|Twitter|Line|Snapchat|TikTok/.test(ua);
    const isSafariProper = isIOS && /Version\//.test(ua) && /Safari\//.test(ua) && !isInAppBrowser;
    const webview = isIOS && (!isSafariProper || isInAppBrowser);
    if (isIOS) setDeviceType('ios');
    else if (/Android/.test(ua)) setDeviceType('android');
    else setDeviceType('other');
    setIsIOSWebView(webview);
    // On iOS, always show banner unless already standalone
    if (isIOS && !isStandalone) setShowBanner(true);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        const sw = reg.installing || reg.waiting || reg.active;
        const send = (s: ServiceWorker) => s.postMessage({ type: 'STORE_URL', url: currentUrl });
        if (reg.active) send(reg.active);
        else if (sw) {
          sw.addEventListener('statechange', () => {
            if (sw.state === 'activated') send(sw);
          });
        }
      }).catch(() => {});
    }
  }, [code]);

  useEffect(() => {
    loadPortal();
  }, [code]);

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg(t.maxSize);
      return;
    }
    setFile(f);
    setErrorMsg('');
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOrder) return;
    if (!amount || parseFloat(amount.replace(/\s/g, '')) <= 0) {
      setErrorMsg(t.amountRequired);
      return;
    }
    if (!file) {
      setErrorMsg(t.fileRequired);
      return;
    }

    setStatus('uploading');
    setErrorMsg('');
    const fd = new FormData();
    fd.append('orderId', selectedOrder.id);
    fd.append('amount', String(parseFloat(amount.replace(/\s/g, ''))));
    if (notes.trim()) fd.append('notes', notes.trim());
    fd.append('receipt', file);

    try {
      const res = await fetch(`${API}/api/public/client/${code}/payment`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setAmount('');
        setNotes('');
        setFile(null);
        setPreview(null);
        await loadPortal();
      } else {
        setStatus('error');
        setErrorMsg(data.message || t.error);
      }
    } catch {
      setStatus('error');
      setErrorMsg(t.error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#071a12', color: 'white', fontFamily: 'system-ui, sans-serif', padding: '24px 16px 120px' }}>
      {isIOSWebView && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#071a12', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🧭</div>
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: 22, textAlign: 'center', margin: '0 0 12px', lineHeight: 1.3 }}>
            Ouvrez dans Safari
          </h1>
          <p style={{ color: '#fca5a5', fontSize: 15, textAlign: 'center', margin: '0 0 28px', lineHeight: 1.6 }}>
            WhatsApp ne permet pas d&apos;installer cette app correctement.{'\n'}Ouvrez ce lien dans Safari pour continuer.
          </p>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 18px', marginBottom: 28 }}>
            {[
              { n: '1', t: 'Appuyez sur ··· en bas à droite' },
              { n: '2', t: 'Choisissez "Ouvrir dans Safari"' },
              { n: '3', t: 'Ajoutez à l\'écran d\'accueil depuis Safari ⬆️' },
            ].map((s) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0B6E4F', color: 'white', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</div>
                <p style={{ color: '#e2e8f0', fontSize: 14, margin: 0, lineHeight: 1.4 }}>{s.t}</p>
              </div>
            ))}
          </div>
          <a href={`x-safari-https://exchange.kabrakeng.com/client/${code}`} style={{ display: 'block', width: '100%', padding: '16px', background: '#0B6E4F', color: 'white', fontWeight: 800, fontSize: 16, textAlign: 'center', borderRadius: 14, textDecoration: 'none', boxSizing: 'border-box', boxShadow: '0 4px 20px rgba(11,110,79,0.5)' }}>
            🧭 Ouvrir dans Safari
          </a>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 12, textAlign: 'center' }}>
            exchange.kabrakeng.com/client/{code}
          </p>
        </div>
      )}

      {showBanner && (
        <>
          {showGuide && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowGuide(false)}>
              <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: '#0a1f15', borderRadius: '24px 24px 0 0', padding: '24px 20px 48px', border: '1px solid rgba(11,110,79,0.4)', maxHeight: '85vh', overflowY: 'auto' }}>
                <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 20px' }} />
                {(deviceType === 'ios' || deviceType === 'other') && (
                  <div style={{ marginBottom: deviceType === 'other' ? 28 : 0 }}>
                    <p style={{ color: '#e8a020', fontWeight: 800, fontSize: 16, margin: '0 0 16px' }}>{t.iosTitle}</p>
                    {t.iosSteps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 16px', marginBottom: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
                        <span style={{ fontSize: 22, lineHeight: 1 }}>{step.icon}</span>
                        <div>
                          <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>{step.text}</p>
                          <p style={{ color: '#86efac', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{step.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {deviceType === 'other' && <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0 24px' }} />}
                {(deviceType === 'android' || deviceType === 'other') && (
                  <div>
                    <p style={{ color: '#86efac', fontWeight: 800, fontSize: 16, margin: '0 0 16px' }}>{t.androidTitle}</p>
                    {t.androidSteps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 16px', marginBottom: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
                        <span style={{ fontSize: 22, lineHeight: 1 }}>{step.icon}</span>
                        <div>
                          <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>{step.text}</p>
                          <p style={{ color: '#86efac', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{step.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => { setShowGuide(false); setShowBanner(false); }} style={{ width: '100%', marginTop: 20, padding: '14px', borderRadius: 14, background: '#0B6E4F', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>✅ {t.installClose}</button>
              </div>
            </div>
          )}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, background: 'linear-gradient(135deg, #0a2d1a, #0f3d24)', borderTop: '2px solid #0B6E4F', padding: '14px 16px 32px', boxShadow: '0 -6px 40px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 28 }}>📲</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 15, margin: 0 }}>{t.installTitle}</p>
                <p style={{ color: '#86efac', fontSize: 12, margin: '2px 0 0', opacity: 0.9 }}>{t.installSub}</p>
              </div>
              <button onClick={() => setShowBanner(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer', padding: '6px 10px', borderRadius: 8, flexShrink: 0 }}>✕</button>
            </div>
            <button onClick={() => setShowGuide(true)} style={{ width: '100%', padding: '13px', borderRadius: 14, background: '#0B6E4F', color: 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(11,110,79,0.5)' }}>{t.installBtn}</button>
          </div>
        </>
      )}

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>👤</div>
        <div style={{ fontWeight: 800, fontSize: 22, color: 'white' }}>{businessName}</div>
        <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} style={{ marginTop: 10, background: 'rgba(232,160,32,0.15)', color: '#e8a020', border: '1px solid rgba(232,160,32,0.3)', borderRadius: 8, padding: '5px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{lang === 'fr' ? 'EN' : 'FR'}</button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 16 }}>
        {pageLoading && <p style={{ textAlign: 'center', color: '#94a3b8' }}>{t.loading}</p>}
        {!pageLoading && loadError && <p style={{ textAlign: 'center', color: '#f87171', fontWeight: 600, padding: 24 }}>{loadError}</p>}

        {!pageLoading && !loadError && client && (
          <>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 24 }}>
              <h1 style={{ color: 'white', fontWeight: 800, fontSize: 22, margin: '0 0 6px' }}>{t.title}</h1>
              <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 20px' }}>{t.subtitle}</p>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{t.client}</span>
                  <span style={{ color: 'white', fontWeight: 700 }}>{client.name}</span>
                </div>
                {client.phone && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>Téléphone</span>
                    <span style={{ color: 'white', fontWeight: 600 }}>{client.phone}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>Code</span>
                  <span style={{ color: '#e8a020', fontWeight: 800, letterSpacing: 2 }}>{client.clientCode}</span>
                </div>
              </div>
            </div>

            {status === 'success' && (
              <div style={{ background: 'rgba(11,110,79,0.12)', border: '1px solid rgba(11,110,79,0.3)', borderRadius: 20, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 10 }}>✅</div>
                <h2 style={{ color: 'white', fontWeight: 800, fontSize: 20, marginBottom: 10 }}>{t.success}</h2>
                <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{t.successSub}</p>
              </div>
            )}

            {(orders || []).length === 0 && (
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 24, textAlign: 'center', color: '#94a3b8' }}>{t.noOrders}</div>
            )}

            {(orders || []).map((order) => {
              const cfg = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
              const canPay = order.status === 'pending' || order.status === 'partial';
              return (
                <div key={order.id} style={{ background: 'rgba(255,255,255,0.05)', border: selectedOrder?.id === order.id ? '1px solid rgba(232,160,32,0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <div style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>{order.reference}</div>
                      <div style={{ color: '#94a3b8', fontSize: 13 }}>{order.payments?.length || 0} {t.payments.toLowerCase()}</div>
                    </div>
                    <div style={{ background: cfg.bg, color: cfg.color, borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 800 }}>{t[`status_${order.status}` as keyof typeof t] as string}</div>
                  </div>

                  <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><span style={{ color: '#94a3b8', fontSize: 13 }}>{t.amount}</span><span style={{ color: 'white', fontWeight: 700 }}>{fmt(order.totalAmount)} {order.currency}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><span style={{ color: '#94a3b8', fontSize: 13 }}>{t.paid}</span><span style={{ color: '#4ade80', fontWeight: 700 }}>{fmt(order.receivedAmount)} {order.currency}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><span style={{ color: '#94a3b8', fontSize: 13 }}>{t.remaining}</span><span style={{ color: parseFloat(String(order.remainingAmount)) > 0 ? '#e8a020' : '#4ade80', fontWeight: 800 }}>{fmt(order.remainingAmount)} {order.currency}</span></div>
                  </div>

                  {!!order.payments?.length && (
                    <div style={{ display: 'grid', gap: 8, marginBottom: canPay ? 16 : 0 }}>
                      {order.payments.map((payment) => {
                        const payCfg = STATUS_COLORS[payment.status] || STATUS_COLORS.pending;
                        return (
                          <div key={payment.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                            <div>
                              <div style={{ color: 'white', fontWeight: 700 }}>{fmt(payment.amount)} {payment.currency}</div>
                              <div style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(payment.createdAt).toLocaleDateString('fr-FR')}</div>
                            </div>
                            <div style={{ background: payCfg.bg, color: payCfg.color, borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 800 }}>{t[`pay_${payment.status}` as keyof typeof t] as string}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {canPay && (
                    <button onClick={() => { setSelectedOrder(order); setStatus('idle'); setErrorMsg(''); }} style={{ width: '100%', padding: 14, borderRadius: 14, background: selectedOrder?.id === order.id ? '#e8a020' : '#0B6E4F', color: 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}>{t.addPayment}</button>
                  )}
                </div>
              );
            })}

            {selectedOrder && ['pending', 'partial'].includes(selectedOrder.status) && (
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 24 }}>
                <h2 style={{ color: 'white', fontWeight: 800, fontSize: 20, margin: '0 0 6px' }}>{t.addPayment}</h2>
                <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 20px' }}>{selectedOrder.reference} — {t.remaining}: <strong style={{ color: '#e8a020' }}>{fmt(selectedOrder.remainingAmount)} {selectedOrder.currency}</strong></p>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: 'white', fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 8 }}>{t.amountToPay}</label>
                  <input value={amount} onChange={e => setAmount(e.target.value)} placeholder={t.amountPlaceholder} inputMode="decimal" style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'white', fontSize: 16, boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: 'white', fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 8 }}>{t.notes}</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t.notesPlaceholder} style={{ width: '100%', minHeight: 78, padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'white', fontSize: 14, boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  <button onClick={() => cameraRef.current?.click()} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, background: 'rgba(11,110,79,0.2)', border: '1px solid rgba(11,110,79,0.4)', color: '#4ade80', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>📷 {file ? t.changeFile : t.takePhoto}</button>
                  <button onClick={() => inputRef.current?.click()} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, background: 'rgba(232,160,32,0.15)', border: '1px solid rgba(232,160,32,0.3)', color: '#e8a020', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>📁 {file ? t.changeFile : t.chooseFile}</button>
                </div>

                {preview && <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 12, marginBottom: 16 }} />}
                {file && !preview && <p style={{ color: '#4ade80', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>📄 {file.name}</p>}
                {errorMsg && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{errorMsg}</p>}

                <button onClick={handleSubmit} disabled={status === 'uploading'} style={{ width: '100%', padding: 16, borderRadius: 16, background: '#0B6E4F', color: 'white', fontWeight: 800, fontSize: 16, border: 'none', cursor: status === 'uploading' ? 'not-allowed' : 'pointer', opacity: status === 'uploading' ? 0.7 : 1 }}>{status === 'uploading' ? t.sending : `📤 ${t.send}`}</button>
              </div>
            )}
          </>
        )}
      </div>

      <p style={{ color: '#334155', fontSize: 12, textAlign: 'center', marginTop: 24 }}>{businessName} © {new Date().getFullYear()} — Powered by KABRAK Exchange Pro</p>
    </div>
  );
}
