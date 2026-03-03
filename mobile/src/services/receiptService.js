import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

const formatAmount = (amount, currency = '') => {
  return `${parseFloat(amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

const RECEIPT_LABELS = {
  fr: {
    receipt: 'Reçu de Transaction',
    clientInfo: 'Informations Client',
    client: 'Client',
    phone: 'Téléphone',
    date: 'Date',
    operator: 'Opérateur',
    exchangeDetail: "Détail de l'Échange",
    rate: 'Taux',
    paymentStatus: 'État du Paiement',
    amountPaid: 'Montant Payé',
    remaining: 'Solde Restant',
    paymentHistory: 'Historique des Paiements',
    dateCol: 'Date',
    method: 'Méthode',
    amount: 'Montant',
    noPayments: 'Aucun paiement enregistré',
    thanks: 'Merci pour votre confiance',
    generated: 'Document généré le',
    statusPaid: 'SOLDÉ',
    statusPartial: 'PARTIEL',
    statusUnpaid: 'NON PAYÉ',
  },
  en: {
    receipt: 'Transaction Receipt',
    clientInfo: 'Client Information',
    client: 'Client',
    phone: 'Phone',
    date: 'Date',
    operator: 'Operator',
    exchangeDetail: 'Exchange Detail',
    rate: 'Rate',
    paymentStatus: 'Payment Status',
    amountPaid: 'Amount Paid',
    remaining: 'Remaining Balance',
    paymentHistory: 'Payment History',
    dateCol: 'Date',
    method: 'Method',
    amount: 'Amount',
    noPayments: 'No payments recorded',
    thanks: 'Thank you for your trust',
    generated: 'Generated on',
    statusPaid: 'PAID',
    statusPartial: 'PARTIAL',
    statusUnpaid: 'UNPAID',
  }
};

const getStatusLabel = (status, lang = 'fr') => {
  const L = RECEIPT_LABELS[lang] || RECEIPT_LABELS.fr;
  switch (status) {
    case 'paid': return { label: L.statusPaid, color: '#2e7d32', bg: '#e8f5e9' };
    case 'partial': return { label: L.statusPartial, color: '#f57c00', bg: '#fff3e0' };
    default: return { label: L.statusUnpaid, color: '#c62828', bg: '#ffebee' };
  }
};

export const generateReceiptHTML = (transaction, settings = {}, lang = 'fr') => {
  // Support old signature: generateReceiptHTML(tx, 'businessName', lang)
  const biz = typeof settings === 'string' ? { businessName: settings } : settings;
  const businessName = biz.businessName || 'KABRAK Exchange Pro';
  const brandColor = biz.brandColor || '#0B6E4F';
  const logoUrl = biz.businessLogo || '';

  const L = RECEIPT_LABELS[lang] || RECEIPT_LABELS.fr;
  const status = getStatusLabel(transaction.status, lang);
  const date = format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm');
  const payments = transaction.payments || [];

  const hexToRgb = (hex) => {
    const h = (hex || '#0B6E4F').replace('#', '');
    return { r: parseInt(h.substring(0,2),16), g: parseInt(h.substring(2,4),16), b: parseInt(h.substring(4,6),16) };
  };
  const rgb = hexToRgb(brandColor);
  const brandLight = `rgba(${rgb.r},${rgb.g},${rgb.b},0.07)`;
  const brandMedium = `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`;

  const logoHTML = logoUrl
    ? `<img src="${logoUrl}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;margin:0 auto 6px;display:block;border:2px solid rgba(255,255,255,0.5);" crossorigin="anonymous" />`
    : '';

  const paymentsRows = payments.slice(0, 5).map((p) => `
    <tr>
      <td>${format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm')}</td>
      <td>${p.paymentMethod?.replace('_', ' ').toUpperCase() || 'CASH'}</td>
      <td style="text-align:right;font-weight:700;color:#059669;">${formatAmount(p.amount, p.currency)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
html{-webkit-text-size-adjust:100%}
body{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;background:#f0f2f5;padding:8px;color:#1f2937;font-size:13px;line-height:1.4}
.r{max-width:420px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.06)}
.hd{background:${brandLight};padding:16px 14px 14px;text-align:center;border-bottom:3px solid ${brandColor}}
.hd h1{font-size:17px;font-weight:900;color:#0a1128;letter-spacing:0.3px;margin-bottom:1px}
.hd .sub{font-size:10px;color:#374151;font-weight:600;letter-spacing:0.5px}
.hd .tp{font-size:11px;color:#1f2937;font-weight:700;margin-top:2px}
.ref{background:${brandColor};border-radius:14px;padding:3px 12px;display:inline-block;margin-top:6px;font-size:10px;font-weight:800;letter-spacing:1px;color:#fff}
.sb{padding:6px 14px;text-align:center;background:${status.bg}}
.sb span{display:inline-block;padding:2px 14px;border-radius:14px;font-size:11px;font-weight:800;color:${status.color};border:2px solid ${status.color};letter-spacing:0.4px}
.bd{padding:12px 14px 8px}
.sec{margin-bottom:10px}
.st{font-size:10px;font-weight:800;color:${brandColor};text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;padding-bottom:4px;border-bottom:1.5px solid ${brandLight}}
.ir{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f3f4f6}
.ir:last-child{border-bottom:none}
.il{font-size:12px;color:#6b7280;font-weight:500}
.iv{font-size:12px;font-weight:700;color:#111827;text-align:right;max-width:58%}
.eb{background:${brandLight};border:1px solid ${brandMedium};border-radius:10px;padding:12px 10px;margin:6px 0;text-align:center}
.ea{font-size:20px;font-weight:900;color:${brandColor}}
.ew{font-size:14px;color:#9ca3af;margin:2px 0}
.er{font-size:18px;font-weight:900;color:#059669}
.et{font-size:10px;color:#6b7280;margin-top:3px;font-weight:500}
.bb{border-radius:8px;padding:8px 10px;margin-top:6px}
.bp{background:#ecfdf5;border:1px solid #a7f3d0}
.br{background:#fef2f2;border:1px solid #fecaca}
.bl{font-size:10px;color:#6b7280;margin-bottom:1px;font-weight:500}
.ba{font-size:15px;font-weight:800}
.bp .ba{color:#059669}
.br .ba{color:#dc2626}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:5px 4px;font-size:9px;font-weight:800;color:${brandColor};text-transform:uppercase;letter-spacing:0.6px;border-bottom:1.5px solid ${brandMedium}}
td{padding:5px 4px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:11px;font-weight:500}
.ft{background:${brandLight};padding:10px 14px;text-align:center;border-top:1.5px solid ${brandMedium}}
.ft .op{font-size:11px;font-weight:700;color:${brandColor};margin-bottom:2px}
.ft p{font-size:11px;color:#374151;font-weight:600}
.ft .dt{font-size:9px;color:#6b7280;margin-top:2px;font-weight:500}
.ft .pw{font-size:8px;color:#9ca3af;margin-top:4px;letter-spacing:0.5px}
.np{text-align:center;color:#9ca3af;font-size:11px;padding:8px;font-weight:500}
</style>
</head>
<body>
<div class="r">
  <div class="hd">
    ${logoHTML}
    <h1>${businessName}</h1>
    <div class="sub">KABRAK Exchange Pro</div>
    <div class="tp">${L.receipt}</div>
    <div class="ref">${transaction.reference}</div>
  </div>
  <div class="sb"><span>${status.label}</span></div>
  <div class="bd">
    <div class="sec">
      <div class="st">${L.clientInfo}</div>
      <div class="ir"><span class="il">${L.client}</span><span class="iv">${transaction.client?.name || 'N/A'}</span></div>
      <div class="ir"><span class="il">${L.phone}</span><span class="iv">${transaction.client?.phone || '-'}</span></div>
      <div class="ir"><span class="il">${L.date}</span><span class="iv">${date}</span></div>
      <div class="ir"><span class="il">${L.operator}</span><span class="iv">${transaction.operator?.name || 'N/A'}</span></div>
    </div>
    <div class="sec">
      <div class="st">${L.exchangeDetail}</div>
      <div class="eb">
        <div class="ea">${formatAmount(transaction.amountFrom, transaction.currencyFrom)}</div>
        <div class="ew">↓</div>
        <div class="er">${formatAmount(transaction.amountTo, transaction.currencyTo)}</div>
        <div class="et">${L.rate}: 1 ${transaction.currencyFrom} = ${parseFloat(transaction.exchangeRate).toFixed(4)} ${transaction.currencyTo}</div>
      </div>
    </div>
    <div class="sec">
      <div class="st">${L.paymentStatus}</div>
      <div class="bb bp"><div class="bl">${L.amountPaid}</div><div class="ba">${formatAmount(transaction.amountPaid, transaction.currencyTo)}</div></div>
      ${parseFloat(transaction.amountRemaining) > 0 ? `<div class="bb br" style="margin-top:4px"><div class="bl">${L.remaining}</div><div class="ba">${formatAmount(transaction.amountRemaining, transaction.currencyTo)}</div></div>` : ''}
    </div>
    ${payments.length > 0 ? `
    <div class="sec">
      <div class="st">${L.paymentHistory}</div>
      <table><thead><tr><th>${L.dateCol}</th><th>${L.method}</th><th style="text-align:right">${L.amount}</th></tr></thead><tbody>${paymentsRows}</tbody></table>
    </div>` : `
    <div class="sec">
      <div class="st">${L.paymentHistory}</div>
      <div class="np">${L.noPayments}</div>
    </div>`}
  </div>
  <div class="ft">
    <div class="op">${transaction.operator?.name || ''}</div>
    <p>${L.thanks}</p>
    <div class="dt">${L.generated} ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
    <div class="pw">KABRAK Exchange Pro</div>
  </div>
</div>
</body>
</html>`;
};

export const printReceipt = async (transaction, settings, lang = 'fr') => {
  try {
    const html = generateReceiptHTML(transaction, settings, lang);
    await Print.printAsync({ html });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const shareReceiptAsPDF = async (transaction, settings, lang = 'fr') => {
  try {
    const html = generateReceiptHTML(transaction, settings, lang);
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) return { success: false, message: 'Sharing not available on this device.' };
    const dialogTitle = lang === 'fr' ? `Reçu ${transaction.reference}` : `Receipt ${transaction.reference}`;
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle,
      UTI: 'com.adobe.pdf'
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
