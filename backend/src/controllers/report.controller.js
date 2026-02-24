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
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name'], required: false }
      ],
      order: [['createdAt', 'ASC']]
    });

    const payments = await Payment.findAll({
      where: { createdAt: { [Op.between]: [startDate, endDate] } },
      include: [{ model: Client, as: 'client', attributes: ['id', 'name'], required: false }],
      order: [['createdAt', 'ASC']]
    });

    // Fetch operators separately to avoid JOIN issues
    const userIds = [...new Set(transactions.map(t => t.userId).filter(Boolean))];
    const operators = userIds.length > 0
      ? await User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: ['id', 'name'] })
      : [];
    const operatorMap = {};
    operators.forEach(u => { operatorMap[u.id] = u.name; });

    const totalTransactionAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amountTo), 0);
    const totalPaymentsReceived = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalOutstanding = transactions
      .filter(t => t.status !== 'paid')
      .reduce((sum, t) => sum + parseFloat(t.amountRemaining), 0);
    const totalProfit = transactions.reduce((sum, t) => sum + parseFloat(t.profit || 0), 0);

    const byCurrency = {};
    transactions.forEach(t => {
      if (!byCurrency[t.currencyTo]) byCurrency[t.currencyTo] = { total: 0, count: 0, paid: 0 };
      byCurrency[t.currencyTo].total += parseFloat(t.amountTo);
      byCurrency[t.currencyTo].count += 1;
      byCurrency[t.currencyTo].paid += parseFloat(t.amountPaid);
    });

    // Stats par employé/opérateur
    const byOperator = {};
    transactions.forEach(t => {
      const opId = t.userId || 'unknown';
      const opName = operatorMap[t.userId] || 'Inconnu';
      if (!byOperator[opId]) byOperator[opId] = { name: opName, count: 0, volume: 0, profit: 0 };
      byOperator[opId].count += 1;
      byOperator[opId].volume += parseFloat(t.amountTo);
      byOperator[opId].profit += parseFloat(t.profit || 0);
    });

    return res.json({
      success: true,
      data: {
        period: { year: y, month: m, startDate, endDate },
        summary: {
          totalTransactions: transactions.length,
          totalTransactionAmount,
          totalPaymentsReceived,
          totalOutstanding,
          totalProfit
        },
        byCurrency,
        byOperator: Object.values(byOperator).sort((a, b) => b.count - a.count),
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
      include: [{ model: Payment, as: 'payments', required: false }],
      order: [['createdAt', 'DESC']]
    });

    const depWhere = { clientId };
    if (dateFilter) depWhere.createdAt = dateFilter;

    const depositOrders = await DepositOrder.findAll({
      where: depWhere,
      include: [
        { model: Deposit, as: 'payments', attributes: ['id', 'code', 'amount', 'status', 'receiptImageUrl', 'createdAt'], separate: true, order: [['createdAt', 'ASC']] }
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

// Feature 6: Profit/Loss Report
const getProfitReport = async (req, res) => {
  try {
    const { year, month, period = 'monthly' } = req.query;
    const y = parseInt(year) || moment().year();
    const m = parseInt(month) || moment().month() + 1;

    let startDate, endDate;
    if (period === 'daily') {
      const day = req.query.day || moment().format('YYYY-MM-DD');
      startDate = moment(day).startOf('day').toDate();
      endDate = moment(day).endOf('day').toDate();
    } else if (period === 'weekly') {
      startDate = moment().startOf('isoWeek').toDate();
      endDate = moment().endOf('isoWeek').toDate();
    } else {
      startDate = moment(`${y}-${m}-01`).startOf('month').toDate();
      endDate = moment(`${y}-${m}-01`).endOf('month').toDate();
    }

    const transactions = await Transaction.findAll({
      where: { createdAt: { [Op.between]: [startDate, endDate] } },
      order: [['createdAt', 'ASC']]
    });

    // Overall profit
    const totalProfit = transactions.reduce((sum, t) => sum + parseFloat(t.profit || 0), 0);
    const totalTransactions = transactions.length;
    const profitableCount = transactions.filter(t => parseFloat(t.profit || 0) > 0).length;
    const lossCount = transactions.filter(t => parseFloat(t.profit || 0) < 0).length;

    // Profit by currency pair
    const byCurrencyPair = {};
    transactions.forEach(t => {
      const pair = `${t.currencyFrom}/${t.currencyTo}`;
      if (!byCurrencyPair[pair]) {
        byCurrencyPair[pair] = { pair, count: 0, volume: 0, profit: 0, avgMargin: 0 };
      }
      byCurrencyPair[pair].count += 1;
      byCurrencyPair[pair].volume += parseFloat(t.amountFrom);
      byCurrencyPair[pair].profit += parseFloat(t.profit || 0);
    });
    Object.values(byCurrencyPair).forEach(p => {
      p.avgMargin = p.count > 0 ? p.profit / p.count : 0;
      p.profit = Math.round(p.profit * 100) / 100;
      p.avgMargin = Math.round(p.avgMargin * 100) / 100;
    });

    // Profit by day (for chart)
    const byDay = {};
    transactions.forEach(t => {
      const day = moment(t.createdAt).format('YYYY-MM-DD');
      if (!byDay[day]) byDay[day] = { date: day, profit: 0, count: 0, volume: 0 };
      byDay[day].profit += parseFloat(t.profit || 0);
      byDay[day].count += 1;
      byDay[day].volume += parseFloat(t.amountTo);
    });
    const dailyData = Object.values(byDay).map(d => ({
      ...d,
      profit: Math.round(d.profit * 100) / 100,
      label: moment(d.date).format('DD/MM')
    }));

    // Profit by type
    const byType = { sell: 0, buy: 0, transfer: 0 };
    const countByType = { sell: 0, buy: 0, transfer: 0 };
    transactions.forEach(t => {
      byType[t.type] = (byType[t.type] || 0) + parseFloat(t.profit || 0);
      countByType[t.type] = (countByType[t.type] || 0) + 1;
    });

    // Previous period comparison
    let prevStartDate, prevEndDate;
    if (period === 'daily') {
      prevStartDate = moment(startDate).subtract(1, 'day').startOf('day').toDate();
      prevEndDate = moment(startDate).subtract(1, 'day').endOf('day').toDate();
    } else if (period === 'weekly') {
      prevStartDate = moment(startDate).subtract(1, 'week').startOf('isoWeek').toDate();
      prevEndDate = moment(startDate).subtract(1, 'week').endOf('isoWeek').toDate();
    } else {
      prevStartDate = moment(startDate).subtract(1, 'month').startOf('month').toDate();
      prevEndDate = moment(startDate).subtract(1, 'month').endOf('month').toDate();
    }
    const prevTransactions = await Transaction.findAll({
      where: { createdAt: { [Op.between]: [prevStartDate, prevEndDate] } },
      attributes: ['profit']
    });
    const prevProfit = prevTransactions.reduce((sum, t) => sum + parseFloat(t.profit || 0), 0);
    const profitChange = prevProfit !== 0 ? ((totalProfit - prevProfit) / Math.abs(prevProfit)) * 100 : (totalProfit > 0 ? 100 : 0);

    return res.json({
      success: true,
      data: {
        period: { type: period, startDate, endDate },
        summary: {
          totalProfit: Math.round(totalProfit * 100) / 100,
          totalTransactions,
          profitableCount,
          lossCount,
          avgProfitPerTransaction: totalTransactions > 0 ? Math.round((totalProfit / totalTransactions) * 100) / 100 : 0,
          profitChange: Math.round(profitChange * 100) / 100,
          previousPeriodProfit: Math.round(prevProfit * 100) / 100
        },
        byCurrencyPair: Object.values(byCurrencyPair).sort((a, b) => b.profit - a.profit),
        byType: Object.entries(byType).map(([type, profit]) => ({
          type, profit: Math.round(profit * 100) / 100, count: countByType[type]
        })),
        dailyData
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMonthlyReport, getClientStatement, getProfitReport };
