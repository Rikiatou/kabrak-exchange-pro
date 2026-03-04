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
  const brandColor = settings?.brandColor || GREEN;
  const logoUrl = settings?.businessLogo || '';

  const logoHTML = logoUrl
    ? `<img src="${logoUrl}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin:0 auto 6px;display:block;" crossorigin="anonymous" />`
    : '';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html{-webkit-text-size-adjust:100%}
body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#fff;color:#000;padding:12px;font-size:13px;line-height:1.4}
.r{max-width:420px;margin:0 auto;background:#fff}
.hd{text-align:center;border-bottom:3px solid ${brandColor};padding-bottom:12px;margin-bottom:10px}
.bn{font-size:18px;font-weight:900;color:#000;letter-spacing:0.2px}
.bs{font-size:10px;color:#000;font-weight:700;margin-top:1px}
.bd{font-size:11px;color:#000;margin-top:3px;font-weight:600}
.rt{font-size:14px;font-weight:900;color:#000;margin:10px 0 6px;text-align:center;text-transform:uppercase;letter-spacing:1px}
.bg{display:inline-block;background:#e6f4ef;color:${brandColor};font-weight:900;font-size:11px;padding:3px 12px;border-radius:14px;margin-bottom:10px}
.ab{background:${brandColor};border-radius:10px;padding:14px;text-align:center;margin:8px 0}
.al{color:#fff;font-size:11px;margin-bottom:2px;font-weight:700}
.av{color:#fff;font-size:26px;font-weight:900;letter-spacing:0.5px}
.ac{color:#fff;font-size:13px;font-weight:700}
.sc{background:#f8f9fa;border-radius:8px;padding:12px;margin-bottom:10px;border-left:3px solid ${brandColor}}
.st{font-size:10px;font-weight:900;color:#000;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px}
.rw{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #ddd}
.rw:last-child{border-bottom:none}
.rl{font-size:12px;color:#000;font-weight:600}
.rv{font-size:12px;font-weight:900;color:#000}
.rv.gd{color:#000;font-size:13px}
.rv.gn{color:#000}
.cs{text-align:center;margin:10px 0}
.cs span{border:3px solid ${brandColor};color:${brandColor};font-weight:900;font-size:14px;padding:4px 18px;border-radius:6px;letter-spacing:2px;display:inline-block}
.ft{text-align:center;margin-top:14px;padding-top:10px;border-top:1px solid #ddd}
.ft p{font-size:10px;color:#000;font-weight:700}
.ft .pw{font-size:8px;color:#000;margin-top:3px}
</style>
</head>
<body>
<div class="r">
  <div class="hd">
    ${logoHTML}
    <div class="bn">${biz}</div>
    ${phone ? `<div class="bd">Tel: ${phone}</div>` : ''}
    ${address ? `<div class="bd">${address}</div>` : ''}
  </div>
  <div style="text-align:center">
    <div class="rt">Recu de Versement</div>
    <div class="bg">CONFIRME</div>
  </div>
  <div class="ab">
    <div class="al">Montant verse</div>
    <div class="av">${fmt(payment.amount)}</div>
    <div class="ac">${payment.currency || order.currency}</div>
  </div>
  <div class="sc">
    <div class="st">Details du versement</div>
    <div class="rw"><span class="rl">Reference versement</span><span class="rv gd">${payment.code || '—'}</span></div>
    <div class="rw"><span class="rl">Date versement</span><span class="rv">${fmtDate(payment.createdAt)}</span></div>
    ${payment.confirmedAt ? `<div class="rw"><span class="rl">Date confirmation</span><span class="rv gn">${fmtDate(payment.confirmedAt)}</span></div>` : ''}
    ${payment.bank || order.bank ? `<div class="rw"><span class="rl">Banque</span><span class="rv">${payment.bank || order.bank}</span></div>` : ''}
  </div>
  <div class="sc">
    <div class="st">Commande liee</div>
    <div class="rw"><span class="rl">Reference commande</span><span class="rv gd">${order.reference}</span></div>
    <div class="rw"><span class="rl">Client</span><span class="rv">${order.clientName}</span></div>
    <div class="rw"><span class="rl">Total commande</span><span class="rv">${fmt(order.totalAmount)} ${order.currency}</span></div>
    <div class="rw"><span class="rl">Total recu</span><span class="rv gn">${fmt(order.receivedAmount)} ${order.currency}</span></div>
    <div class="rw"><span class="rl">Reste a payer</span><span class="rv" style="color:${parseFloat(order.remainingAmount) <= 0 ? brandColor : GOLD}">${fmt(order.remainingAmount)} ${order.currency}</span></div>
  </div>
  <div class="cs"><span>CONFIRME</span></div>
  <div class="ft">
    <p>${biz} — ${new Date().toLocaleDateString('fr-FR')}</p>
    <div class="pw">KABRAK Exchange Pro</div>
  </div>
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
  const brandColor = settings?.brandColor || GREEN;
  const logoUrl = settings?.businessLogo || '';
  const tx = transaction;

  const logoHTML = logoUrl
    ? `<img src="${logoUrl}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin:0 auto 6px;display:block;" crossorigin="anonymous" />`
    : '';

  const statusLabel = {
    paid: 'PAYE',
    partial: 'PARTIEL',
    unpaid: 'NON PAYE',
    cancelled: 'ANNULE',
  }[tx.status] || tx.status;

  const statusColor = {
    paid: brandColor,
    partial: GOLD,
    unpaid: '#dc2626',
    cancelled: '#6b7280',
  }[tx.status] || '#333';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html{-webkit-text-size-adjust:100%}
body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#fff;color:#000;padding:12px;font-size:13px;line-height:1.4}
.r{max-width:420px;margin:0 auto;background:#fff}
.hd{text-align:center;border-bottom:3px solid ${brandColor};padding-bottom:12px;margin-bottom:10px}
.bn{font-size:18px;font-weight:900;color:#000;letter-spacing:0.2px}
.bs{font-size:10px;color:#000;font-weight:700;margin-top:1px}
.bd{font-size:11px;color:#000;margin-top:3px;font-weight:600}
.rt{font-size:14px;font-weight:900;color:#000;margin:10px 0 6px;text-align:center;text-transform:uppercase;letter-spacing:1px}
.sb{display:inline-block;font-weight:900;font-size:12px;padding:3px 14px;border-radius:14px;margin:4px 0 10px}
.sc{background:#f8f9fa;border-radius:8px;padding:12px;margin-bottom:10px;border-left:3px solid ${brandColor}}
.st{font-size:10px;font-weight:900;color:#000;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px}
.rw{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #ddd}
.rw:last-child{border-bottom:none}
.rl{font-size:12px;color:#000;font-weight:600}
.rv{font-size:12px;font-weight:900;color:#000}
.eb{display:flex;align-items:center;justify-content:center;gap:12px;background:#f8f9fa;border:1px solid #ddd;border-radius:10px;padding:14px;margin:8px 0}
.es{text-align:center}
.ea{font-size:22px;font-weight:900;color:#000}
.ec{font-size:11px;color:#000;margin-top:1px;font-weight:700}
.ew{font-size:24px;color:#000;font-weight:900}
.ft{text-align:center;margin-top:14px;padding-top:10px;border-top:1px solid #ddd}
.ft p{font-size:10px;color:#000;font-weight:700}
.ft .pw{font-size:8px;color:#000;margin-top:3px}
</style>
</head>
<body>
<div class="r">
  <div class="hd">
    ${logoHTML}
    <div class="bn">${biz}</div>
    ${phone ? `<div class="bd">Tel: ${phone}</div>` : ''}
    ${address ? `<div class="bd">${address}</div>` : ''}
  </div>
  <div style="text-align:center">
    <div class="rt">Recu de Transaction</div>
    <div class="sb" style="background:${statusColor}18;color:${statusColor}">${statusLabel}</div>
  </div>
  <div class="eb">
    <div class="es"><div class="ea">${fmt(tx.amountFrom)}</div><div class="ec">${tx.currencyFrom}</div></div>
    <div class="ew">→</div>
    <div class="es"><div class="ea">${fmt(tx.amountTo)}</div><div class="ec">${tx.currencyTo}</div></div>
  </div>
  <div class="sc">
    <div class="st">Details</div>
    <div class="rw"><span class="rl">Reference</span><span class="rv" style="color:${GOLD}">${tx.reference}</span></div>
    <div class="rw"><span class="rl">Client</span><span class="rv">${tx.client?.name || tx.clientName || '—'}</span></div>
    <div class="rw"><span class="rl">Date</span><span class="rv">${fmtDate(tx.createdAt)}</span></div>
    <div class="rw"><span class="rl">Taux</span><span class="rv">${tx.rate || '—'}</span></div>
    ${tx.notes ? `<div class="rw"><span class="rl">Notes</span><span class="rv">${tx.notes}</span></div>` : ''}
  </div>
  <div class="sc">
    <div class="st">Paiement</div>
    <div class="rw"><span class="rl">Total du</span><span class="rv">${fmt(tx.amountTo)} ${tx.currencyTo}</span></div>
    <div class="rw"><span class="rl">Montant paye</span><span class="rv" style="color:${brandColor}">${fmt(tx.paidAmount || 0)} ${tx.currencyTo}</span></div>
    <div class="rw"><span class="rl">Reste</span><span class="rv" style="color:${GOLD}">${fmt((parseFloat(tx.amountTo || 0) - parseFloat(tx.paidAmount || 0)).toFixed(0))} ${tx.currencyTo}</span></div>
  </div>
  <div class="ft">
    <p>${biz} — ${new Date().toLocaleDateString('fr-FR')}</p>
    <div class="pw">KABRAK Exchange Pro</div>
  </div>
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
