const { Op } = require('sequelize');
const { Transaction, Client, Payment, Currency, User, DepositOrder, Deposit } = require('../models');
const moment = require('moment');

const getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year) || moment().year();
    const m = parseInt(month) || moment().month() + 1;
    const startDate = moment(`${y}-${m}-01`).startOf('month').toDate();
    const endDate = moment(`${y}-${m}-01`).endOf('month').toDate();

    const transactions = await Transaction.findAll({
      where: { createdAt: { [Op.between]: [startDate, endDate] } },
      include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']]
    });

    const payments = await Payment.findAll({
      where: { createdAt: { [Op.between]: [startDate, endDate] } },
      include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']]
    });

    const totalTransactionAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amountTo), 0);
    const totalPaymentsReceived = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalOutstanding = transactions
      .filter(t => t.status !== 'paid')
      .reduce((sum, t) => sum + parseFloat(t.amountRemaining), 0);

    const byCurrency = {};
    transactions.forEach(t => {
      if (!byCurrency[t.currencyTo]) byCurrency[t.currencyTo] = { total: 0, count: 0, paid: 0 };
      byCurrency[t.currencyTo].total += parseFloat(t.amountTo);
      byCurrency[t.currencyTo].count += 1;
      byCurrency[t.currencyTo].paid += parseFloat(t.amountPaid);
    });

    return res.json({
      success: true,
      data: {
        period: { year: y, month: m, startDate, endDate },
        summary: {
          totalTransactions: transactions.length,
          totalTransactionAmount,
          totalPaymentsReceived,
          totalOutstanding
        },
        byCurrency,
        transactions,
        payments
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getClientStatement = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { startDate, endDate } = req.query;
    const client = await Client.findByPk(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });

    const dateFilter = startDate && endDate
      ? { [Op.between]: [new Date(startDate), new Date(endDate)] }
      : undefined;

    const txWhere = { clientId };
    if (dateFilter) txWhere.createdAt = dateFilter;

    const transactions = await Transaction.findAll({
      where: txWhere,
      include: [{ model: Payment, as: 'payments' }],
      order: [['createdAt', 'DESC']]
    });

    const depWhere = { clientId };
    if (dateFilter) depWhere.createdAt = dateFilter;

    const depositOrders = await DepositOrder.findAll({
      where: depWhere,
      include: [
        { model: Deposit, as: 'payments', attributes: ['id', 'code', 'amount', 'status', 'receiptImageUrl', 'createdAt'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      success: true,
      data: {
        client,
        transactions,
        depositOrders,
        summary: {
          totalTransactions: transactions.length,
          totalAmount: transactions.reduce((s, t) => s + parseFloat(t.amountTo), 0),
          totalPaid: transactions.reduce((s, t) => s + parseFloat(t.amountPaid), 0),
          totalRemaining: transactions.reduce((s, t) => s + parseFloat(t.amountRemaining), 0),
          totalDepositOrders: depositOrders.length,
          totalDeposited: depositOrders.reduce((s, o) => s + parseFloat(o.receivedAmount || 0), 0),
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMonthlyReport, getClientStatement };
