const { Op } = require('sequelize');
const { CashClose, Transaction, Payment, CashBook, Deposit, User } = require('../models');
const moment = require('moment');

// GET /api/cash-close — list all closings
const getAll = async (req, res) => {
  try {
    const closes = await CashClose.findAll({
      order: [['date', 'DESC']],
      limit: 60,
      include: [{ model: User, as: 'closer', attributes: ['id', 'name'] }],
    });
    res.json({ success: true, data: closes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/cash-close/today — get today's summary (not yet closed)
const getTodaySummary = async (req, res) => {
  try {
    const date = moment().format('YYYY-MM-DD');
    const start = moment(date).startOf('day').toDate();
    const end = moment(date).endOf('day').toDate();

    const existing = await CashClose.findOne({ where: { date } });

    const [transactions, payments, cashbookEntries, depositsConfirmed] = await Promise.all([
      Transaction.findAll({
        where: { createdAt: { [Op.between]: [start, end] } },
        attributes: ['id', 'reference', 'currencyFrom', 'currencyTo', 'amountFrom', 'amountTo', 'amountPaid', 'amountRemaining', 'status', 'type'],
      }),
      Payment.findAll({
        where: { createdAt: { [Op.between]: [start, end] } },
        attributes: ['id', 'amount', 'currency', 'paymentMethod'],
      }),
      CashBook.findAll({
        where: { createdAt: { [Op.between]: [start, end] } },
        attributes: ['id', 'type', 'amount', 'currency', 'category'],
      }),
      Deposit.findAll({
        where: { confirmedAt: { [Op.between]: [start, end] }, status: 'confirmed' },
        attributes: ['id', 'amount', 'currency'],
      }),
    ]);

    const totalPaymentsReceived = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    const totalIncome = cashbookEntries.filter(e => e.type === 'income').reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalExpense = cashbookEntries.filter(e => e.type === 'expense').reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalDepositsConfirmed = depositsConfirmed.reduce((s, d) => s + parseFloat(d.amount), 0);

    // Group payments by method
    const byMethod = {};
    payments.forEach(p => {
      if (!byMethod[p.paymentMethod]) byMethod[p.paymentMethod] = 0;
      byMethod[p.paymentMethod] += parseFloat(p.amount);
    });

    // Group transactions by currency
    const byCurrency = {};
    transactions.forEach(t => {
      if (!byCurrency[t.currencyTo]) byCurrency[t.currencyTo] = { count: 0, volume: 0, paid: 0 };
      byCurrency[t.currencyTo].count++;
      byCurrency[t.currencyTo].volume += parseFloat(t.amountTo);
      byCurrency[t.currencyTo].paid += parseFloat(t.amountPaid);
    });

    res.json({
      success: true,
      data: {
        date,
        alreadyClosed: !!existing,
        existing: existing || null,
        summary: {
          totalTransactions: transactions.length,
          totalPaymentsReceived,
          totalIncome,
          totalExpense,
          totalDepositsConfirmed,
          netCash: totalPaymentsReceived + totalIncome - totalExpense,
        },
        byMethod,
        byCurrency,
        transactions,
        payments,
        cashbookEntries,
        depositsConfirmed,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/cash-close — close the day
const closeDay = async (req, res) => {
  try {
    const { date, openingBalance, notes, currency = 'FCFA' } = req.body;
    const closeDate = date || moment().format('YYYY-MM-DD');

    const existing = await CashClose.findOne({ where: { date: closeDate } });
    if (existing) {
      return res.status(400).json({ success: false, message: `La caisse du ${closeDate} est déjà clôturée.` });
    }

    const start = moment(closeDate).startOf('day').toDate();
    const end = moment(closeDate).endOf('day').toDate();

    const [payments, cashbookEntries, transactions, depositsConfirmed] = await Promise.all([
      Payment.findAll({ where: { createdAt: { [Op.between]: [start, end] } } }),
      CashBook.findAll({ where: { createdAt: { [Op.between]: [start, end] } } }),
      Transaction.findAll({ where: { createdAt: { [Op.between]: [start, end] } } }),
      Deposit.findAll({ where: { confirmedAt: { [Op.between]: [start, end] }, status: 'confirmed' } }),
    ]);

    const totalPaymentsReceived = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    const totalIncome = cashbookEntries.filter(e => e.type === 'income').reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalExpense = cashbookEntries.filter(e => e.type === 'expense').reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalDepositsConfirmed = depositsConfirmed.reduce((s, d) => s + parseFloat(d.amount), 0);
    const opening = parseFloat(openingBalance || 0);
    const closingBalance = opening + totalPaymentsReceived + totalIncome - totalExpense;

    const byMethod = {};
    payments.forEach(p => {
      if (!byMethod[p.paymentMethod]) byMethod[p.paymentMethod] = 0;
      byMethod[p.paymentMethod] += parseFloat(p.amount);
    });

    const byCurrency = {};
    transactions.forEach(t => {
      if (!byCurrency[t.currencyTo]) byCurrency[t.currencyTo] = { count: 0, volume: 0 };
      byCurrency[t.currencyTo].count++;
      byCurrency[t.currencyTo].volume += parseFloat(t.amountTo);
    });

    const close = await CashClose.create({
      date: closeDate,
      openingBalance: opening,
      closingBalance,
      totalIncome,
      totalExpense,
      totalPaymentsReceived,
      totalTransactions: transactions.length,
      totalDepositsConfirmed,
      currency,
      notes: notes || null,
      status: 'closed',
      closedBy: req.user.id,
      summary: { byMethod, byCurrency },
    });

    res.status(201).json({ success: true, data: close });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/cash-close/:id
const getById = async (req, res) => {
  try {
    const close = await CashClose.findByPk(req.params.id, {
      include: [{ model: User, as: 'closer', attributes: ['id', 'name'] }],
    });
    if (!close) return res.status(404).json({ success: false, message: 'Clôture introuvable' });
    res.json({ success: true, data: close });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getTodaySummary, closeDay, getById };
