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

export const generateReceiptHTML = (transaction, businessName = 'KABRAK Exchange Pro', lang = 'fr') => {
  const L = RECEIPT_LABELS[lang] || RECEIPT_LABELS.fr;
  const status = getStatusLabel(transaction.status, lang);
  const date = format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm');
  const payments = transaction.payments || [];

  const paymentsRows = payments.map((p) => `
    <tr>
      <td>${format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm')}</td>
      <td>${p.paymentMethod?.replace('_', ' ').toUpperCase() || 'CASH'}</td>
      <td style="text-align:right; font-weight:600; color:#2e7d32;">${formatAmount(p.amount, p.currency)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reçu ${transaction.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; color: #1a1a2e; }
    .receipt { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a237e, #3949ab); color: #fff; padding: 28px 24px; text-align: center; }
    .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 2px; }
    .header .kabrak-sub { font-size: 11px; opacity: 0.65; margin-bottom: 4px; letter-spacing: 0.5px; }
    .header p { font-size: 13px; opacity: 0.85; }
    .ref-badge { background: rgba(255,255,255,0.2); border-radius: 20px; padding: 6px 16px; display: inline-block; margin-top: 12px; font-size: 13px; font-weight: 600; letter-spacing: 1px; }
    .status-bar { padding: 10px 24px; text-align: center; background: ${status.bg}; }
    .status-badge { display: inline-block; padding: 4px 20px; border-radius: 20px; font-size: 13px; font-weight: 700; color: ${status.color}; border: 1.5px solid ${status.color}; }
    .body { padding: 24px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #f0f0f0; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
    .info-label { font-size: 13px; color: #6b7280; }
    .info-value { font-size: 13px; font-weight: 600; color: #1a1a2e; text-align: right; max-width: 60%; }
    .exchange-box { background: #f0f4ff; border-radius: 10px; padding: 16px; margin: 16px 0; text-align: center; }
    .exchange-amount { font-size: 26px; font-weight: 700; color: #1a237e; }
    .exchange-arrow { font-size: 20px; color: #9ca3af; margin: 6px 0; }
    .exchange-result { font-size: 22px; font-weight: 700; color: #00897b; }
    .exchange-rate { font-size: 12px; color: #9ca3af; margin-top: 6px; }
    .balance-box { border-radius: 10px; padding: 14px 16px; margin-top: 12px; }
    .balance-paid { background: #e8f5e9; }
    .balance-remaining { background: #ffebee; }
    .balance-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .balance-amount { font-size: 18px; font-weight: 700; }
    .balance-paid .balance-amount { color: #2e7d32; }
    .balance-remaining .balance-amount { color: #c62828; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 6px; font-size: 11px; color: #9ca3af; text-transform: uppercase; border-bottom: 1px solid #f0f0f0; }
    td { padding: 8px 6px; border-bottom: 1px solid #f9f9f9; color: #374151; }
    .footer { background: #f9f9f9; padding: 16px 24px; text-align: center; border-top: 1px solid #f0f0f0; }
    .footer p { font-size: 12px; color: #9ca3af; }
    .footer .operator { font-size: 13px; font-weight: 600; color: #1a237e; margin-bottom: 4px; }
    .no-payments { text-align: center; color: #9ca3af; font-size: 13px; padding: 12px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${businessName}</h1>
      <div class="kabrak-sub">KABRAK Exchange Pro</div>
      <p>${L.receipt}</p>
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
