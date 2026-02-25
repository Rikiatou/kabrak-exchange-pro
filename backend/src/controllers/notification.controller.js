const { Transaction, Client, Payment, User, Setting } = require('../models');
const moment = require('moment');

const getBusinessInfo = async () => {
  try {
    const rows = await Setting.findAll();
    const s = {};
    rows.forEach(r => { s[r.key] = r.value; });
    return {
      name: s.businessName || 'KABRAK Exchange Pro',
      phone: s.businessPhone || '',
      address: s.businessAddress || '',
    };
  } catch (_) {
    return { name: 'KABRAK Exchange Pro', phone: '', address: '' };
  }
};

const fmt = (amount, currency = '') => {
  const num = parseFloat(amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return currency ? `${num} ${currency}` : num;
};

// POST /api/notifications/transaction-confirmation
// Generates a message for a transaction confirmation (SMS/WhatsApp text)
const transactionConfirmation = async (req, res) => {
  try {
    const { transactionId, lang = 'fr' } = req.body;
    if (!transactionId) return res.status(400).json({ success: false, message: 'transactionId required.' });

    const tx = await Transaction.findByPk(transactionId, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] },
      ]
    });
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    const business = await getBusinessInfo();
    const date = moment(tx.createdAt).format('DD/MM/YYYY HH:mm');
    const statusMap = {
      fr: { paid: 'SOLDÉ', partial: 'PARTIEL', unpaid: 'NON PAYÉ' },
      en: { paid: 'PAID', partial: 'PARTIAL', unpaid: 'UNPAID' },
    };
    const statusLabel = (statusMap[lang] || statusMap.fr)[tx.status] || tx.status;

    let message;
    if (lang === 'en') {
      message = `📋 *${business.name}*\n` +
        `Transaction Receipt\n\n` +
        `🔖 Ref: ${tx.reference}\n` +
        `👤 Client: ${tx.client?.name || 'N/A'}\n` +
        `📅 Date: ${date}\n\n` +
        `💱 Exchange:\n` +
        `${fmt(tx.amountFrom, tx.currencyFrom)} → ${fmt(tx.amountTo, tx.currencyTo)}\n` +
        `Rate: 1 ${tx.currencyFrom} = ${parseFloat(tx.exchangeRate).toFixed(2)} ${tx.currencyTo}\n\n` +
        `💰 Status: ${statusLabel}\n` +
        `✅ Paid: ${fmt(tx.amountPaid, tx.currencyTo)}\n` +
        (parseFloat(tx.amountRemaining) > 0 ? `⚠️ Remaining: ${fmt(tx.amountRemaining, tx.currencyTo)}\n` : '') +
        `\n👨‍💼 Operator: ${tx.operator?.name || 'N/A'}\n` +
        (business.phone ? `📞 ${business.phone}\n` : '') +
        `\nThank you for your trust! 🙏`;
    } else {
      message = `📋 *${business.name}*\n` +
        `Reçu de Transaction\n\n` +
        `🔖 Réf: ${tx.reference}\n` +
        `👤 Client: ${tx.client?.name || 'N/A'}\n` +
        `📅 Date: ${date}\n\n` +
        `💱 Échange:\n` +
        `${fmt(tx.amountFrom, tx.currencyFrom)} → ${fmt(tx.amountTo, tx.currencyTo)}\n` +
        `Taux: 1 ${tx.currencyFrom} = ${parseFloat(tx.exchangeRate).toFixed(2)} ${tx.currencyTo}\n\n` +
        `💰 Statut: ${statusLabel}\n` +
        `✅ Payé: ${fmt(tx.amountPaid, tx.currencyTo)}\n` +
        (parseFloat(tx.amountRemaining) > 0 ? `⚠️ Reste: ${fmt(tx.amountRemaining, tx.currencyTo)}\n` : '') +
        `\n👨‍💼 Opérateur: ${tx.operator?.name || 'N/A'}\n` +
        (business.phone ? `📞 ${business.phone}\n` : '') +
        `\nMerci pour votre confiance ! 🙏`;
    }

    return res.json({
      success: true,
      data: {
        message,
        clientPhone: tx.client?.phone || null,
        clientName: tx.client?.name || null,
        reference: tx.reference,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/notifications/payment-reminder
// Generates a payment reminder message
const paymentReminder = async (req, res) => {
  try {
    const { transactionId, lang = 'fr' } = req.body;
    if (!transactionId) return res.status(400).json({ success: false, message: 'transactionId required.' });

    const tx = await Transaction.findByPk(transactionId, {
      include: [{ model: Client, as: 'client' }]
    });
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    if (tx.status === 'paid') return res.status(400).json({ success: false, message: 'Transaction already paid.' });

    const business = await getBusinessInfo();
    const dueInfo = tx.dueDate ? moment(tx.dueDate).format('DD/MM/YYYY') : null;

    let message;
    if (lang === 'en') {
      message = `🔔 *Payment Reminder*\n` +
        `${business.name}\n\n` +
        `Dear ${tx.client?.name || 'Client'},\n\n` +
        `This is a reminder for your pending payment:\n\n` +
        `🔖 Ref: ${tx.reference}\n` +
        `💰 Remaining: *${fmt(tx.amountRemaining, tx.currencyTo)}*\n` +
        (dueInfo ? `📅 Due: ${dueInfo}\n` : '') +
        `\nPlease settle your balance at your earliest convenience.\n` +
        (business.phone ? `📞 Contact: ${business.phone}\n` : '') +
        `\nThank you! 🙏`;
    } else {
      message = `🔔 *Rappel de Paiement*\n` +
        `${business.name}\n\n` +
        `Cher(e) ${tx.client?.name || 'Client'},\n\n` +
        `Ceci est un rappel pour votre paiement en attente :\n\n` +
        `🔖 Réf: ${tx.reference}\n` +
        `💰 Reste à payer: *${fmt(tx.amountRemaining, tx.currencyTo)}*\n` +
        (dueInfo ? `📅 Échéance: ${dueInfo}\n` : '') +
        `\nMerci de bien vouloir régler votre solde dans les meilleurs délais.\n` +
        (business.phone ? `📞 Contact: ${business.phone}\n` : '') +
        `\nMerci ! 🙏`;
    }

    return res.json({
      success: true,
      data: {
        message,
        clientPhone: tx.client?.phone || null,
        clientName: tx.client?.name || null,
        reference: tx.reference,
        amountRemaining: parseFloat(tx.amountRemaining),
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/notifications/rate-alert
// Generates a rate change notification message
const rateAlertNotification = async (req, res) => {
  try {
    const { currencyCode, oldRate, newRate, lang = 'fr' } = req.body;
    if (!currencyCode || !newRate) return res.status(400).json({ success: false, message: 'currencyCode and newRate required.' });

    const business = await getBusinessInfo();
    const change = oldRate ? ((newRate - oldRate) / oldRate * 100).toFixed(2) : null;
    const direction = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';

    let message;
    if (lang === 'en') {
      message = `${direction} *Rate Update — ${business.name}*\n\n` +
        `Currency: *${currencyCode}*\n` +
        (oldRate ? `Previous: ${parseFloat(oldRate).toFixed(2)}\n` : '') +
        `New rate: *${parseFloat(newRate).toFixed(2)}*\n` +
        (change ? `Change: ${change > 0 ? '+' : ''}${change}%\n` : '') +
        `\n📅 ${moment().format('DD/MM/YYYY HH:mm')}\n` +
        (business.phone ? `📞 ${business.phone}` : '');
    } else {
      message = `${direction} *Mise à jour du taux — ${business.name}*\n\n` +
        `Devise: *${currencyCode}*\n` +
        (oldRate ? `Ancien taux: ${parseFloat(oldRate).toFixed(2)}\n` : '') +
        `Nouveau taux: *${parseFloat(newRate).toFixed(2)}*\n` +
        (change ? `Variation: ${change > 0 ? '+' : ''}${change}%\n` : '') +
        `\n📅 ${moment().format('DD/MM/YYYY HH:mm')}\n` +
        (business.phone ? `📞 ${business.phone}` : '');
    }

    return res.json({ success: true, data: { message } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { transactionConfirmation, paymentReminder, rateAlertNotification };
