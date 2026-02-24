const { Op, fn, col, literal, sequelize: sq } = require('sequelize');
const { Transaction, Client, Payment, Currency, DepositOrder, sequelize } = require('../models');
const moment = require('moment');

const getDashboard = async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const monthStart = moment().startOf('month').toDate();
    const monthEnd = moment().endOf('month').toDate();
    const sevenDaysAgo = moment().subtract(6, 'days').startOf('day').toDate();

    const [
      totalOutstanding,
      totalTransactions,
      unpaidCount,
      partialCount,
      paidCount,
      todayTransactions,
      todayPayments,
      monthPayments,
      debtorClients,
      recentTransactions,
      currencies,
      last7Transactions,
      topCurrencies,
      recentDepositOrders,
    ] = await Promise.all([
      Transaction.sum('amountRemaining', { where: { status: { [Op.in]: ['unpaid', 'partial'] } } }),
      Transaction.count(),
      Transaction.count({ where: { status: 'unpaid' } }),
      Transaction.count({ where: { status: 'partial' } }),
      Transaction.count({ where: { status: 'paid' } }),
      Transaction.count({ where: { createdAt: { [Op.between]: [today, todayEnd] } } }),
      Payment.sum('amount', { where: { createdAt: { [Op.between]: [today, todayEnd] } } }),
      Payment.sum('amount', { where: { createdAt: { [Op.between]: [monthStart, monthEnd] } } }),
      Client.findAll({
        where: { totalDebt: { [Op.gt]: 0 }, isActive: true },
        order: [['totalDebt', 'DESC']],
        limit: 10,
        attributes: ['id', 'name', 'phone', 'totalDebt', 'totalPaid'],
      }),
      Transaction.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
      }),
      Currency.findAll({ where: { isActive: true } }),
      // Last 7 days: count + volume per day
      Transaction.findAll({
        where: { createdAt: { [Op.gte]: sevenDaysAgo } },
        attributes: [
          [fn('DATE', col('createdAt')), 'day'],
          [fn('COUNT', col('id')), 'count'],
          [fn('SUM', col('amountTo')), 'volume'],
        ],
        group: [fn('DATE', col('createdAt'))],
        order: [[fn('DATE', col('createdAt')), 'ASC']],
        raw: true,
      }),
      // Top currencies by transaction count
      Transaction.findAll({
        attributes: [
          'currencyTo',
          [fn('COUNT', col('id')), 'count'],
          [fn('SUM', col('amountTo')), 'volume'],
        ],
        group: ['currencyTo'],
        order: [[fn('COUNT', col('id')), 'DESC']],
        limit: 6,
        raw: true,
      }),
      // Recent deposit orders
      DepositOrder.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
      }),
    ]);

    // Build full 7-day array (fill missing days with 0)
    const dailyChart = [];
    for (let i = 6; i >= 0; i--) {
      const day = moment().subtract(i, 'days').format('YYYY-MM-DD');
      const found = last7Transactions.find(r => r.day === day);
      dailyChart.push({
        day,
        label: moment(day).format('DD/MM'),
        count: found ? parseInt(found.count) : 0,
        volume: found ? parseFloat(found.volume) || 0 : 0,
      });
    }

    return res.json({
      success: true,
      data: {
        summary: {
          totalOutstanding: totalOutstanding || 0,
          totalTransactions,
          unpaidCount,
          partialCount,
          paidCount,
          todayTransactions,
          todayPayments: todayPayments || 0,
          monthPayments: monthPayments || 0,
        },
        debtorClients,
        recentTransactions,
        recentDepositOrders,
        currencies,
        charts: {
          dailyVolume: dailyChart,
          topCurrencies: topCurrencies.map(r => ({
            currency: r.currencyTo,
            count: parseInt(r.count),
            volume: parseFloat(r.volume) || 0,
          })),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard };
