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

  // Derive a lighter tint from brandColor for backgrounds
  const hexToRgb = (hex) => {
    const h = hex.replace('#', '');
    return { r: parseInt(h.substring(0,2),16), g: parseInt(h.substring(2,4),16), b: parseInt(h.substring(4,6),16) };
  };
  const rgb = hexToRgb(brandColor);
  const brandLight = `rgba(${rgb.r},${rgb.g},${rgb.b},0.08)`;
  const brandMedium = `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`;

  const logoHTML = logoUrl ? `<img src="${logoUrl}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;margin:0 auto 10px;display:block;border:2px solid rgba(255,255,255,0.4);" />` : '';

  const paymentsRows = payments.map((p) => `
    <tr>
      <td>${format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm')}</td>
      <td>${p.paymentMethod?.replace('_', ' ').toUpperCase() || 'CASH'}</td>
      <td style="text-align:right; font-weight:600; color:#2e7d32;">${formatAmount(p.amount, p.currency)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <title>Reçu ${transaction.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f0f2f5; padding: 16px; color: #1f2937;
      line-height: 1.5; font-size: 14px;
    }
    .receipt {
      max-width: 500px; margin: 0 auto; background: #fff;
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }

    /* HEADER */
    .header {
      background: ${brandColor};
      color: #fff; padding: 24px 20px; text-align: center;
      position: relative;
    }
    .header::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0;
      height: 4px; background: linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.05));
    }
    .header h1 { font-size: 20px; font-weight: 800; letter-spacing: 0.3px; margin-bottom: 2px; }
    .header .sub { font-size: 12px; opacity: 0.7; letter-spacing: 0.5px; }
    .header .type { font-size: 13px; opacity: 0.9; margin-top: 2px; font-weight: 500; }
    .ref-badge {
      background: rgba(255,255,255,0.2); border-radius: 20px;
      padding: 5px 16px; display: inline-block; margin-top: 10px;
      font-size: 12px; font-weight: 700; letter-spacing: 1.2px;
      backdrop-filter: blur(4px);
    }

    /* STATUS */
    .status-bar { padding: 10px 20px; text-align: center; background: ${status.bg}; }
    .status-badge {
      display: inline-block; padding: 4px 20px; border-radius: 20px;
      font-size: 12px; font-weight: 800; color: ${status.color};
      border: 2px solid ${status.color}; letter-spacing: 0.5px;
    }

    /* BODY */
    .body { padding: 20px; }
    .section { margin-bottom: 18px; }
    .section-title {
      font-size: 11px; font-weight: 800; color: ${brandColor};
      text-transform: uppercase; letter-spacing: 1.2px;
      margin-bottom: 8px; padding-bottom: 6px;
      border-bottom: 2px solid ${brandLight};
    }

    /* INFO ROWS */
    .info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 7px 0; border-bottom: 1px solid #f3f4f6;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-size: 13px; color: #6b7280; font-weight: 500; }
    .info-value { font-size: 13px; font-weight: 700; color: #111827; text-align: right; max-width: 58%; }

    /* EXCHANGE BOX */
    .exchange-box {
      background: ${brandLight}; border: 1px solid ${brandMedium};
      border-radius: 12px; padding: 18px 16px; margin: 12px 0; text-align: center;
    }
    .exchange-amount { font-size: 24px; font-weight: 800; color: ${brandColor}; }
    .exchange-arrow { font-size: 18px; color: #9ca3af; margin: 4px 0; }
    .exchange-result { font-size: 22px; font-weight: 800; color: #059669; }
    .exchange-rate { font-size: 12px; color: #6b7280; margin-top: 6px; font-weight: 500; }

    /* BALANCE */
    .balance-box { border-radius: 10px; padding: 12px 14px; margin-top: 10px; }
    .balance-paid { background: #ecfdf5; border: 1px solid #a7f3d0; }
    .balance-remaining { background: #fef2f2; border: 1px solid #fecaca; }
    .balance-label { font-size: 12px; color: #6b7280; margin-bottom: 2px; font-weight: 500; }
    .balance-amount { font-size: 18px; font-weight: 800; }
    .balance-paid .balance-amount { color: #059669; }
    .balance-remaining .balance-amount { color: #dc2626; }

    /* TABLE */
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left; padding: 8px 6px; font-size: 10px; font-weight: 800;
      color: ${brandColor}; text-transform: uppercase; letter-spacing: 0.8px;
      border-bottom: 2px solid ${brandMedium};
    }
    td { padding: 8px 6px; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 13px; font-weight: 500; }

    /* FOOTER */
    .footer {
      background: ${brandLight}; padding: 16px 20px; text-align: center;
      border-top: 2px solid ${brandMedium};
    }
    .footer .operator { font-size: 13px; font-weight: 700; color: ${brandColor}; margin-bottom: 4px; }
    .footer p { font-size: 12px; color: #6b7280; font-weight: 500; }
    .footer .powered { font-size: 10px; color: #9ca3af; margin-top: 6px; letter-spacing: 0.5px; }

    .no-payments { text-align: center; color: #9ca3af; font-size: 13px; padding: 12px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      ${logoHTML}
      <h1>${businessName}</h1>
      <div class="sub">KABRAK Exchange Pro</div>
      <div class="type">${L.receipt}</div>
      <div class="ref-badge">${transaction.reference}</div>
    </div>
    <div class="status-bar">
      <span class="status-badge">${status.label}</span>
    </div>
    <div class="body">
      <div class="section">
        <div class="section-title">${L.clientInfo}</div>
        <div class="info-row">
          <span class="info-label">${L.client}</span>
          <span class="info-value">${transaction.client?.name || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${L.phone}</span>
          <span class="info-value">${transaction.client?.phone || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${L.date}</span>
          <span class="info-value">${date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${L.operator}</span>
          <span class="info-value">${transaction.operator?.name || 'N/A'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">${L.exchangeDetail}</div>
        <div class="exchange-box">
          <div class="exchange-amount">${formatAmount(transaction.amountFrom, transaction.currencyFrom)}</div>
          <div class="exchange-arrow">↓</div>
          <div class="exchange-result">${formatAmount(transaction.amountTo, transaction.currencyTo)}</div>
          <div class="exchange-rate">${L.rate}: 1 ${transaction.currencyFrom} = ${parseFloat(transaction.exchangeRate).toFixed(4)} ${transaction.currencyTo}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">${L.paymentStatus}</div>
        <div class="balance-box balance-paid">
          <div class="balance-label">${L.amountPaid}</div>
          <div class="balance-amount">${formatAmount(transaction.amountPaid, transaction.currencyTo)}</div>
        </div>
        ${parseFloat(transaction.amountRemaining) > 0 ? `
        <div class="balance-box balance-remaining" style="margin-top:8px;">
          <div class="balance-label">${L.remaining}</div>
          <div class="balance-amount">${formatAmount(transaction.amountRemaining, transaction.currencyTo)}</div>
        </div>` : ''}
      </div>

      ${payments.length > 0 ? `
      <div class="section">
        <div class="section-title">${L.paymentHistory}</div>
        <table>
          <thead>
            <tr><th>${L.dateCol}</th><th>${L.method}</th><th style="text-align:right;">${L.amount}</th></tr>
          </thead>
          <tbody>${paymentsRows}</tbody>
        </table>
      </div>` : `
      <div class="section">
        <div class="section-title">${L.paymentHistory}</div>
        <div class="no-payments">${L.noPayments}</div>
      </div>`}
    </div>
    <div class="footer">
      <div class="operator">${transaction.operator?.name || ''}</div>
      <p>${L.thanks}</p>
      <p style="margin-top:4px; font-size:11px;">${L.generated} ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      <div class="powered">KABRAK Exchange Pro</div>
    </div>
  </div>
</body>
</html>`;
};

export const printReceipt = async (transaction, businessName, lang = 'fr') => {
  try {
    const html = generateReceiptHTML(transaction, businessName, lang);
    await Print.printAsync({ html });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const shareReceiptAsPDF = async (transaction, businessName, lang = 'fr') => {
  try {
    const html = generateReceiptHTML(transaction, businessName, lang);
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
