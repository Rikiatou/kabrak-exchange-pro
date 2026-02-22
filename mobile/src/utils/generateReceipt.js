import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const GREEN = '#0B6E4F';
const GOLD = '#e8a020';

const fmt = (n) => parseFloat(String(n || 0)).toLocaleString('fr-FR');
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * Génère et partage un reçu PDF pour un versement confirmé (DepositOrder payment)
 * @param {object} params
 * @param {object} params.order  - DepositOrder
 * @param {object} params.payment - Deposit (versement)
 * @param {object} params.settings - { businessName, businessPhone, businessAddress }
 */
export const shareDepositReceipt = async ({ order, payment, settings }) => {
  const biz = settings?.businessName || 'KABRAK Exchange Pro';
  const phone = settings?.businessPhone || '';
  const address = settings?.businessAddress || '';

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; background:#fff; color:#1a1a1a; padding: 32px; }
  .header { text-align:center; border-bottom: 3px solid ${GREEN}; padding-bottom: 20px; margin-bottom: 24px; }
  .biz-name { font-size: 22px; font-weight: 800; color: ${GREEN}; }
  .biz-sub { font-size: 11px; color: #888; margin-top: 2px; }
  .biz-detail { font-size: 12px; color: #555; margin-top: 4px; }
  .receipt-title { font-size: 16px; font-weight: 700; color: #333; margin: 20px 0 16px; text-align:center; text-transform: uppercase; letter-spacing: 1px; }
  .badge { display: inline-block; background: #e6f4ef; color: ${GREEN}; font-weight: 800; font-size: 13px; padding: 4px 14px; border-radius: 20px; margin-bottom: 20px; }
  .section { background: #f8fffe; border-radius: 10px; padding: 16px; margin-bottom: 16px; border-left: 4px solid ${GREEN}; }
  .section-title { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #eee; }
  .row:last-child { border-bottom: none; }
  .row-label { font-size: 13px; color: #666; }
  .row-value { font-size: 13px; font-weight: 700; color: #1a1a1a; }
  .row-value.gold { color: ${GOLD}; font-size: 15px; }
  .row-value.green { color: ${GREEN}; }
  .amount-box { background: ${GREEN}; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
  .amount-label { color: rgba(255,255,255,0.7); font-size: 12px; margin-bottom: 4px; }
  .amount-value { color: #fff; font-size: 28px; font-weight: 800; }
  .amount-currency { color: rgba(255,255,255,0.8); font-size: 14px; }
  .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; }
  .footer-text { font-size: 11px; color: #aaa; }
  .confirmed-stamp { text-align:center; margin: 16px 0; }
  .confirmed-stamp span { border: 3px solid ${GREEN}; color: ${GREEN}; font-weight: 800; font-size: 18px; padding: 6px 24px; border-radius: 8px; letter-spacing: 2px; transform: rotate(-5deg); display: inline-block; }
</style>
</head>
<body>
  <div class="header">
    <div class="biz-name">${biz}</div>
    <div class="biz-sub">KABRAK Exchange Pro</div>
    ${phone ? `<div class="biz-detail">📞 ${phone}</div>` : ''}
    ${address ? `<div class="biz-detail">📍 ${address}</div>` : ''}
  </div>

  <div style="text-align:center">
    <div class="receipt-title">Reçu de Versement</div>
    <div class="badge">✅ CONFIRMÉ</div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Montant versé</div>
    <div class="amount-value">${fmt(payment.amount)}</div>
    <div class="amount-currency">${payment.currency || order.currency}</div>
  </div>

  <div class="section">
    <div class="section-title">Détails du versement</div>
    <div class="row"><span class="row-label">Référence versement</span><span class="row-value gold">${payment.code || '—'}</span></div>
    <div class="row"><span class="row-label">Date versement</span><span class="row-value">${fmtDate(payment.createdAt)}</span></div>
    ${payment.confirmedAt ? `<div class="row"><span class="row-label">Date confirmation</span><span class="row-value green">${fmtDate(payment.confirmedAt)}</span></div>` : ''}
    ${payment.bank || order.bank ? `<div class="row"><span class="row-label">Banque</span><span class="row-value">${payment.bank || order.bank}</span></div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Commande liée</div>
    <div class="row"><span class="row-label">Référence commande</span><span class="row-value gold">${order.reference}</span></div>
    <div class="row"><span class="row-label">Client</span><span class="row-value">${order.clientName}</span></div>
    <div class="row"><span class="row-label">Total commande</span><span class="row-value">${fmt(order.totalAmount)} ${order.currency}</span></div>
    <div class="row"><span class="row-label">Total reçu</span><span class="row-value green">${fmt(order.receivedAmount)} ${order.currency}</span></div>
    <div class="row"><span class="row-label">Reste à payer</span><span class="row-value" style="color:${parseFloat(order.remainingAmount) <= 0 ? GREEN : GOLD}">${fmt(order.remainingAmount)} ${order.currency}</span></div>
  </div>

  <div class="confirmed-stamp"><span>CONFIRMÉ</span></div>

  <div class="footer">
    <div class="footer-text">${biz} — KABRAK Exchange Pro — ${new Date().toLocaleDateString('fr-FR')}</div>
  </div>
</body>
</html>`;

  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Reçu versement ${payment.code || order.reference}`,
      UTI: 'com.adobe.pdf',
    });
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

/**
 * Génère et partage un reçu PDF pour une transaction de change
 * @param {object} params
 * @param {object} params.transaction - Transaction object
 * @param {object} params.settings - { businessName, businessPhone, businessAddress }
 */
export const shareTransactionReceipt = async ({ transaction, settings }) => {
  const biz = settings?.businessName || 'KABRAK Exchange Pro';
  const phone = settings?.businessPhone || '';
  const address = settings?.businessAddress || '';
  const tx = transaction;

  const statusLabel = {
    paid: 'PAYÉ',
    partial: 'PARTIEL',
    unpaid: 'NON PAYÉ',
    cancelled: 'ANNULÉ',
  }[tx.status] || tx.status;

  const statusColor = {
    paid: GREEN,
    partial: GOLD,
    unpaid: '#dc2626',
    cancelled: '#6b7280',
  }[tx.status] || '#333';

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; background:#fff; color:#1a1a1a; padding: 32px; }
  .header { text-align:center; border-bottom: 3px solid ${GREEN}; padding-bottom: 20px; margin-bottom: 24px; }
  .biz-name { font-size: 22px; font-weight: 800; color: ${GREEN}; }
  .biz-sub { font-size: 11px; color: #888; margin-top: 2px; }
  .biz-detail { font-size: 12px; color: #555; margin-top: 4px; }
  .receipt-title { font-size: 16px; font-weight: 700; color: #333; margin: 20px 0 16px; text-align:center; text-transform: uppercase; letter-spacing: 1px; }
  .section { background: #f8fffe; border-radius: 10px; padding: 16px; margin-bottom: 16px; border-left: 4px solid ${GREEN}; }
  .section-title { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #eee; }
  .row:last-child { border-bottom: none; }
  .row-label { font-size: 13px; color: #666; }
  .row-value { font-size: 13px; font-weight: 700; color: #1a1a1a; }
  .exchange-box { display: flex; align-items: center; justify-content: center; gap: 16px; background: #f0faf5; border-radius: 12px; padding: 20px; margin: 20px 0; }
  .ex-side { text-align: center; }
  .ex-amount { font-size: 22px; font-weight: 800; color: ${GREEN}; }
  .ex-currency { font-size: 13px; color: #888; margin-top: 2px; }
  .ex-arrow { font-size: 28px; color: ${GOLD}; }
  .status-badge { display: inline-block; font-weight: 800; font-size: 14px; padding: 5px 18px; border-radius: 20px; margin: 8px 0; }
  .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; }
  .footer-text { font-size: 11px; color: #aaa; }
</style>
</head>
<body>
  <div class="header">
    <div class="biz-name">${biz}</div>
    <div class="biz-sub">KABRAK Exchange Pro</div>
    ${phone ? `<div class="biz-detail">📞 ${phone}</div>` : ''}
    ${address ? `<div class="biz-detail">📍 ${address}</div>` : ''}
  </div>

  <div style="text-align:center">
    <div class="receipt-title">Reçu de Transaction</div>
    <div class="status-badge" style="background:${statusColor}22; color:${statusColor}">${statusLabel}</div>
  </div>

  <div class="exchange-box">
    <div class="ex-side">
      <div class="ex-amount">${fmt(tx.amountFrom)}</div>
      <div class="ex-currency">${tx.currencyFrom}</div>
    </div>
    <div class="ex-arrow">→</div>
    <div class="ex-side">
      <div class="ex-amount">${fmt(tx.amountTo)}</div>
      <div class="ex-currency">${tx.currencyTo}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Détails</div>
    <div class="row"><span class="row-label">Référence</span><span class="row-value" style="color:${GOLD}">${tx.reference}</span></div>
    <div class="row"><span class="row-label">Client</span><span class="row-value">${tx.client?.name || tx.clientName || '—'}</span></div>
    <div class="row"><span class="row-label">Date</span><span class="row-value">${fmtDate(tx.createdAt)}</span></div>
    <div class="row"><span class="row-label">Taux</span><span class="row-value">${tx.rate || '—'}</span></div>
    ${tx.notes ? `<div class="row"><span class="row-label">Notes</span><span class="row-value">${tx.notes}</span></div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Paiement</div>
    <div class="row"><span class="row-label">Total dû</span><span class="row-value">${fmt(tx.amountTo)} ${tx.currencyTo}</span></div>
    <div class="row"><span class="row-label">Montant payé</span><span class="row-value" style="color:${GREEN}">${fmt(tx.paidAmount || 0)} ${tx.currencyTo}</span></div>
    <div class="row"><span class="row-label">Reste</span><span class="row-value" style="color:${GOLD}">${fmt((parseFloat(tx.amountTo || 0) - parseFloat(tx.paidAmount || 0)).toFixed(0))} ${tx.currencyTo}</span></div>
  </div>

  <div class="footer">
    <div class="footer-text">${biz} — KABRAK Exchange Pro — ${new Date().toLocaleDateString('fr-FR')}</div>
  </div>
</body>
</html>`;

  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Reçu transaction ${tx.reference}`,
      UTI: 'com.adobe.pdf',
    });
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
};
