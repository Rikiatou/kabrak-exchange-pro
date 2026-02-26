const PDFDocument = require('pdfkit');
const { Transaction, Client, Payment, User, Setting } = require('../models');
const moment = require('moment');
const https = require('https');
const http = require('http');

const fetchImageBuffer = (url) => new Promise((resolve) => {
  if (!url) return resolve(null);
  const client = url.startsWith('https') ? https : http;
  client.get(url, (res) => {
    const chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => resolve(Buffer.concat(chunks)));
    res.on('error', () => resolve(null));
  }).on('error', () => resolve(null));
});

const GREEN = '#0B6E4F';
const DARK = '#1a1a2e';
const GRAY = '#6b7280';
const LIGHT_BG = '#f0f4ff';

const getBusinessInfo = async (operatorId) => {
  try {
    let ownerId = operatorId;
    if (operatorId) {
      const op = await User.findByPk(operatorId, { attributes: ['id', 'teamOwnerId'] });
      if (op?.teamOwnerId) ownerId = op.teamOwnerId;
    }
    const where = ownerId ? { userId: ownerId } : {};
    const rows = await Setting.findAll({ where });
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    return {
      name: settings.businessName || 'Mon Bureau de Change',
      phone: settings.businessPhone || '',
      address: settings.businessAddress || '',
      email: settings.businessEmail || '',
      brandColor: settings.brandColor || '#0B6E4F',
      logo: settings.businessLogo || null,
    };
  } catch (_) {
    return { name: 'Mon Bureau de Change', phone: '', address: '', email: '', brandColor: '#0B6E4F', logo: null };
  }
};

const fmt = (amount, currency = '') => {
  const num = parseFloat(amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${num} ${currency}` : num;
};

const statusLabels = {
  fr: { paid: 'SOLDÉ', partial: 'PARTIEL', unpaid: 'NON PAYÉ' },
  en: { paid: 'PAID', partial: 'PARTIAL', unpaid: 'UNPAID' },
};

const labels = {
  fr: {
    receipt: 'Reçu de Transaction',
    clientInfo: 'INFORMATIONS CLIENT',
    client: 'Client',
    phone: 'Téléphone',
    date: 'Date',
    operator: 'Opérateur',
    exchangeDetail: 'DÉTAIL DE L\'ÉCHANGE',
    rate: 'Taux',
    given: 'Donné',
    received: 'Reçu',
    paymentStatus: 'ÉTAT DU PAIEMENT',
    amountPaid: 'Montant Payé',
    remaining: 'Solde Restant',
    paymentHistory: 'HISTORIQUE DES PAIEMENTS',
    method: 'Méthode',
    amount: 'Montant',
    noPayments: 'Aucun paiement enregistré',
    thanks: 'Merci pour votre confiance',
    generated: 'Document généré le',
    type: 'Type',
    reference: 'Référence',
  },
  en: {
    receipt: 'Transaction Receipt',
    clientInfo: 'CLIENT INFORMATION',
    client: 'Client',
    phone: 'Phone',
    date: 'Date',
    operator: 'Operator',
    exchangeDetail: 'EXCHANGE DETAIL',
    rate: 'Rate',
    given: 'Given',
    received: 'Received',
    paymentStatus: 'PAYMENT STATUS',
    amountPaid: 'Amount Paid',
    remaining: 'Remaining Balance',
    paymentHistory: 'PAYMENT HISTORY',
    method: 'Method',
    amount: 'Amount',
    noPayments: 'No payments recorded',
    thanks: 'Thank you for your trust',
    generated: 'Generated on',
    type: 'Type',
    reference: 'Reference',
  },
};

// GET /api/receipts/:transactionId
const generateReceipt = async (req, res) => {
  try {
    const lang = req.query.lang === 'en' ? 'en' : 'fr';
    const L = labels[lang];
    const SL = statusLabels[lang];

    const transaction = await Transaction.findByPk(req.params.transactionId, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] },
        { model: Payment, as: 'payments', include: [{ model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] }] }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const business = await getBusinessInfo(transaction.operator?.id);
    const BRAND = business.brandColor || '#0B6E4F';
    const logoBuffer = await fetchImageBuffer(business.logo);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt_${transaction.reference}.pdf"`);
    doc.pipe(res);

    // --- Header ---
    doc.rect(0, 0, doc.page.width, 130).fill(BRAND);

    // Logo if available
    if (logoBuffer) {
      const logoSize = 52;
      const logoX = (doc.page.width - logoSize) / 2;
      try { doc.image(logoBuffer, logoX, 14, { width: logoSize, height: logoSize }); } catch (_) {}
      doc.fontSize(16).fillColor('#ffffff').font('Helvetica-Bold')
        .text(business.name, 50, 72, { align: 'center' });
      if (business.address || business.phone) {
        doc.fontSize(9).fillColor('rgba(255,255,255,0.65)').font('Helvetica')
          .text([business.address, business.phone].filter(Boolean).join(' · '), 50, 92, { align: 'center' });
      }
      doc.fontSize(12).fillColor('rgba(255,255,255,0.85)')
        .text(L.receipt, 50, 108, { align: 'center' });
    } else {
      doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold')
        .text(business.name, 50, 30, { align: 'center' });
      if (business.address || business.phone) {
        doc.fontSize(9).fillColor('rgba(255,255,255,0.65)').font('Helvetica')
          .text([business.address, business.phone].filter(Boolean).join(' · '), 50, 56, { align: 'center' });
      }
      doc.fontSize(13).fillColor('rgba(255,255,255,0.85)')
        .text(L.receipt, 50, 72, { align: 'center' });
    }

    // Reference badge
    const refText = transaction.reference;
    const refWidth = doc.widthOfString(refText) + 30;
    const refX = (doc.page.width - refWidth) / 2;
    doc.roundedRect(refX, 108, refWidth, 22, 11).fill('rgba(255,255,255,0.2)');
    doc.fontSize(11).fillColor('#ffffff').font('Helvetica-Bold')
      .text(refText, refX, 112, { width: refWidth, align: 'center' });

    // --- Status bar ---
    const statusKey = transaction.status || 'unpaid';
    const statusLabel = SL[statusKey] || SL.unpaid;
    const statusColors = { paid: '#e8f5e9', partial: '#fff3e0', unpaid: '#ffebee' };
    const statusTextColors = { paid: '#2e7d32', partial: '#f57c00', unpaid: '#c62828' };

    doc.rect(0, 130, doc.page.width, 30).fill(statusColors[statusKey] || statusColors.unpaid);
    doc.fontSize(11).fillColor(statusTextColors[statusKey] || statusTextColors.unpaid).font('Helvetica-Bold')
      .text(statusLabel, 50, 138, { align: 'center' });

    let y = 170;

    // --- Client Info Section ---
    doc.fontSize(9).fillColor(GRAY).font('Helvetica-Bold').text(L.clientInfo, 50, y);
    y += 4;
    doc.moveTo(50, y + 12).lineTo(doc.page.width - 50, y + 12).stroke('#e5e7eb');
    y += 20;

    const infoRows = [
      [L.client, transaction.client?.name || 'N/A'],
      [L.phone, transaction.client?.phone || '-'],
      [L.date, moment(transaction.createdAt).format('DD/MM/YYYY HH:mm')],
      [L.operator, [transaction.operator?.firstName, transaction.operator?.lastName].filter(Boolean).join(' ') || 'N/A'],
      [L.type, (transaction.type || 'sell').toUpperCase()],
    ];

    infoRows.forEach(([label, value]) => {
      doc.fontSize(11).fillColor(GRAY).font('Helvetica').text(label, 50, y);
      doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold').text(value, 300, y, { align: 'right', width: doc.page.width - 350 });
      y += 20;
    });

    y += 10;

    // --- Exchange Detail ---
    doc.fontSize(9).fillColor(GRAY).font('Helvetica-Bold').text(L.exchangeDetail, 50, y);
    y += 4;
    doc.moveTo(50, y + 12).lineTo(doc.page.width - 50, y + 12).stroke('#e5e7eb');
    y += 22;

    // Exchange box
    const boxX = 50;
    const boxW = doc.page.width - 100;
    doc.roundedRect(boxX, y, boxW, 90, 8).fill(LIGHT_BG);

    doc.fontSize(20).fillColor(DARK).font('Helvetica-Bold')
      .text(fmt(transaction.amountFrom, transaction.currencyFrom), boxX, y + 12, { width: boxW, align: 'center' });
    doc.fontSize(16).fillColor(GRAY).text('↓', boxX, y + 36, { width: boxW, align: 'center' });
    doc.fontSize(18).fillColor(GREEN).font('Helvetica-Bold')
      .text(fmt(transaction.amountTo, transaction.currencyTo), boxX, y + 52, { width: boxW, align: 'center' });
    doc.fontSize(10).fillColor(GRAY).font('Helvetica')
      .text(`${L.rate}: 1 ${transaction.currencyFrom} = ${parseFloat(transaction.exchangeRate).toFixed(4)} ${transaction.currencyTo}`, boxX, y + 74, { width: boxW, align: 'center' });

    y += 105;

    // --- Payment Status ---
    doc.fontSize(9).fillColor(GRAY).font('Helvetica-Bold').text(L.paymentStatus, 50, y);
    y += 4;
    doc.moveTo(50, y + 12).lineTo(doc.page.width - 50, y + 12).stroke('#e5e7eb');
    y += 22;

    // Paid box
    doc.roundedRect(50, y, (boxW / 2) - 5, 50, 6).fill('#e8f5e9');
    doc.fontSize(10).fillColor(GRAY).font('Helvetica').text(L.amountPaid, 60, y + 8);
    doc.fontSize(15).fillColor('#2e7d32').font('Helvetica-Bold').text(fmt(transaction.amountPaid, transaction.currencyTo), 60, y + 26);

    // Remaining box
    if (parseFloat(transaction.amountRemaining) > 0) {
      doc.roundedRect(50 + (boxW / 2) + 5, y, (boxW / 2) - 5, 50, 6).fill('#ffebee');
      doc.fontSize(10).fillColor(GRAY).font('Helvetica').text(L.remaining, 60 + (boxW / 2) + 5, y + 8);
      doc.fontSize(15).fillColor('#c62828').font('Helvetica-Bold').text(fmt(transaction.amountRemaining, transaction.currencyTo), 60 + (boxW / 2) + 5, y + 26);
    }

    y += 65;

    // --- Payment History ---
    const payments = transaction.payments || [];
    doc.fontSize(9).fillColor(GRAY).font('Helvetica-Bold').text(L.paymentHistory, 50, y);
    y += 4;
    doc.moveTo(50, y + 12).lineTo(doc.page.width - 50, y + 12).stroke('#e5e7eb');
    y += 22;

    if (payments.length > 0) {
      // Table header
      doc.fontSize(9).fillColor(GRAY).font('Helvetica-Bold');
      doc.text(L.date, 50, y);
      doc.text(L.method, 200, y);
      doc.text(L.amount, 400, y, { align: 'right', width: doc.page.width - 450 });
      y += 16;
      doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke('#f0f0f0');
      y += 6;

      payments.forEach((p) => {
        if (y > doc.page.height - 100) {
          doc.addPage();
          y = 50;
        }
        doc.fontSize(11).fillColor(DARK).font('Helvetica');
        doc.text(moment(p.createdAt).format('DD/MM/YYYY HH:mm'), 50, y);
        doc.text((p.paymentMethod || 'cash').replace('_', ' ').toUpperCase(), 200, y);
        doc.fillColor('#2e7d32').font('Helvetica-Bold')
          .text(fmt(p.amount, p.currency), 400, y, { align: 'right', width: doc.page.width - 450 });
        y += 20;
      });
    } else {
      doc.fontSize(11).fillColor(GRAY).font('Helvetica').text(L.noPayments, 50, y, { align: 'center', width: boxW });
      y += 20;
    }

    y += 20;

    // --- Footer ---
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 50;
    }
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke('#e5e7eb');
    y += 12;
    doc.fontSize(12).fillColor(DARK).font('Helvetica-Bold')
      .text(L.thanks, 50, y, { align: 'center', width: boxW });
    y += 20;

    const footerParts = [business.phone, business.address, business.email].filter(Boolean);
    if (footerParts.length > 0) {
      doc.fontSize(9).fillColor(GRAY).font('Helvetica')
        .text(footerParts.join(' · '), 50, y, { align: 'center', width: boxW });
      y += 14;
    }

    doc.fontSize(9).fillColor(GRAY).font('Helvetica')
      .text(`${L.generated} ${moment().format('DD/MM/YYYY HH:mm')}`, 50, y, { align: 'center', width: boxW });
    y += 14;
    doc.fontSize(7).fillColor('#c0c0c0').font('Helvetica')
      .text('Powered by KABRAK Exchange Pro', 50, y, { align: 'center', width: boxW });

    doc.end();
  } catch (error) {
    console.error('Receipt generation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/receipts/:transactionId/html — returns HTML receipt for email embedding
const generateReceiptHTML = async (req, res) => {
  try {
    const lang = req.query.lang === 'en' ? 'en' : 'fr';
    const L = labels[lang];
    const SL = statusLabels[lang];

    const transaction = await Transaction.findByPk(req.params.transactionId, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] },
        { model: Payment, as: 'payments' }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const business = await getBusinessInfo(transaction.operator?.id);
    const BRAND = business.brandColor || '#0B6E4F';
    const statusKey = transaction.status || 'unpaid';
    const statusLabel = SL[statusKey] || SL.unpaid;
    const statusColors = { paid: '#e8f5e9', partial: '#fff3e0', unpaid: '#ffebee' };
    const statusTextColors = { paid: '#2e7d32', partial: '#f57c00', unpaid: '#c62828' };
    const payments = transaction.payments || [];

    const paymentsRows = payments.map(p => `
      <tr>
        <td>${moment(p.createdAt).format('DD/MM/YYYY HH:mm')}</td>
        <td>${(p.paymentMethod || 'cash').replace('_', ' ').toUpperCase()}</td>
        <td style="text-align:right;font-weight:600;color:#2e7d32;">${fmt(p.amount, p.currency)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;color:#1a1a2e}
    .receipt{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)}
    .header{background:linear-gradient(135deg,#071a12,${BRAND});color:#fff;padding:28px 24px;text-align:center}
    .header h1{font-size:22px;font-weight:700;margin-bottom:2px}
    .header .sub{font-size:11px;opacity:.65;letter-spacing:.5px}
    .header p{font-size:13px;opacity:.85;margin-top:4px}
    .ref-badge{background:rgba(255,255,255,.2);border-radius:20px;padding:6px 16px;display:inline-block;margin-top:12px;font-size:13px;font-weight:600;letter-spacing:1px}
    .status-bar{padding:10px 24px;text-align:center;background:${statusColors[statusKey]}}
    .status-badge{display:inline-block;padding:4px 20px;border-radius:20px;font-size:13px;font-weight:700;color:${statusTextColors[statusKey]};border:1.5px solid ${statusTextColors[statusKey]}}
    .body{padding:24px}
    .section{margin-bottom:20px}
    .section-title{font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f0f0f0}
    .info-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0}
    .info-label{font-size:13px;color:#6b7280}
    .info-value{font-size:13px;font-weight:600;color:#1a1a2e;text-align:right;max-width:60%}
    .exchange-box{background:#f0fdf4;border-radius:10px;padding:16px;margin:16px 0;text-align:center}
    .exchange-amount{font-size:26px;font-weight:700;color:#071a12}
    .exchange-arrow{font-size:20px;color:#9ca3af;margin:6px 0}
    .exchange-result{font-size:22px;font-weight:700;color:#0B6E4F}
    .exchange-rate{font-size:12px;color:#9ca3af;margin-top:6px}
    .balance-box{border-radius:10px;padding:14px 16px;margin-top:8px}
    .balance-paid{background:#e8f5e9}
    .balance-remaining{background:#ffebee}
    .balance-label{font-size:12px;color:#6b7280;margin-bottom:4px}
    .balance-amount{font-size:18px;font-weight:700}
    .balance-paid .balance-amount{color:#2e7d32}
    .balance-remaining .balance-amount{color:#c62828}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{text-align:left;padding:8px 6px;font-size:11px;color:#9ca3af;text-transform:uppercase;border-bottom:1px solid #f0f0f0}
    td{padding:8px 6px;border-bottom:1px solid #f9f9f9;color:#374151}
    .footer{background:#f9f9f9;padding:16px 24px;text-align:center;border-top:1px solid #f0f0f0}
    .footer p{font-size:12px;color:#9ca3af}
    .footer .thanks{font-size:13px;font-weight:600;color:#0B6E4F;margin-bottom:4px}
    .no-payments{text-align:center;color:#9ca3af;font-size:13px;padding:12px}
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      ${business.logo ? `<img src="${business.logo}" style="width:64px;height:64px;border-radius:12px;object-fit:contain;margin-bottom:10px;background:rgba(255,255,255,0.15);padding:4px;" />` : ''}
      <h1>${business.name}</h1>
      ${business.address || business.phone ? `<div class="sub">${[business.address, business.phone].filter(Boolean).join(' · ')}</div>` : ''}
      <p>${L.receipt}</p>
      <div class="ref-badge">${transaction.reference}</div>
    </div>
    <div class="status-bar"><span class="status-badge">${statusLabel}</span></div>
    <div class="body">
      <div class="section">
        <div class="section-title">${L.clientInfo}</div>
        <div class="info-row"><span class="info-label">${L.client}</span><span class="info-value">${transaction.client?.name || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">${L.phone}</span><span class="info-value">${transaction.client?.phone || '-'}</span></div>
        <div class="info-row"><span class="info-label">${L.date}</span><span class="info-value">${moment(transaction.createdAt).format('DD/MM/YYYY HH:mm')}</span></div>
        <div class="info-row"><span class="info-label">${L.operator}</span><span class="info-value">${[transaction.operator?.firstName, transaction.operator?.lastName].filter(Boolean).join(' ') || 'N/A'}</span></div>
      </div>
      <div class="section">
        <div class="section-title">${L.exchangeDetail}</div>
        <div class="exchange-box">
          <div class="exchange-amount">${fmt(transaction.amountFrom, transaction.currencyFrom)}</div>
          <div class="exchange-arrow">↓</div>
          <div class="exchange-result">${fmt(transaction.amountTo, transaction.currencyTo)}</div>
          <div class="exchange-rate">${L.rate}: 1 ${transaction.currencyFrom} = ${parseFloat(transaction.exchangeRate).toFixed(4)} ${transaction.currencyTo}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">${L.paymentStatus}</div>
        <div class="balance-box balance-paid">
          <div class="balance-label">${L.amountPaid}</div>
          <div class="balance-amount">${fmt(transaction.amountPaid, transaction.currencyTo)}</div>
        </div>
        ${parseFloat(transaction.amountRemaining) > 0 ? `
        <div class="balance-box balance-remaining">
          <div class="balance-label">${L.remaining}</div>
          <div class="balance-amount">${fmt(transaction.amountRemaining, transaction.currencyTo)}</div>
        </div>` : ''}
      </div>
      ${payments.length > 0 ? `
      <div class="section">
        <div class="section-title">${L.paymentHistory}</div>
        <table>
          <thead><tr><th>${L.date}</th><th>${L.method}</th><th style="text-align:right">${L.amount}</th></tr></thead>
          <tbody>${paymentsRows}</tbody>
        </table>
      </div>` : `
      <div class="section">
        <div class="section-title">${L.paymentHistory}</div>
        <div class="no-payments">${L.noPayments}</div>
      </div>`}
    </div>
    <div class="footer">
      <div class="thanks">${L.thanks}</div>
      ${[business.phone, business.address, business.email].filter(Boolean).length > 0 ? `<p>${[business.phone, business.address, business.email].filter(Boolean).join(' · ')}</p>` : ''}
      <p style="margin-top:4px;font-size:11px">${L.generated} ${moment().format('DD/MM/YYYY HH:mm')}</p>
      <p style="margin-top:6px;font-size:10px;color:#c0c0c0">Powered by KABRAK Exchange Pro</p>
    </div>
  </div>
</body>
</html>`;

    return res.json({ success: true, data: { html } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateReceipt, generateReceiptHTML };
