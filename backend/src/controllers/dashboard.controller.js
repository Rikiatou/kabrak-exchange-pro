const { Op, fn, col, literal, sequelize: sq } = require('sequelize');
const { Transaction, Client, Payment, Currency, DepositOrder, sequelize } = require('../models');
const moment = require('moment');

const getDashboard = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const today = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const weekStart = moment().startOf('isoWeek').toDate();
    const weekEnd = moment().endOf('isoWeek').toDate();
    const monthStart = moment().startOf('month').toDate();
    const monthEnd = moment().endOf('month').toDate();
    const sevenDaysAgo = moment().subtract(6, 'days').startOf('day').toDate();

    // Get all user IDs in this bureau (owner + team members)
    const { User } = require('../models');
    const [teamUsers] = await sequelize.query(
      `SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId`,
      { replacements: { ownerId } }
    );
    const userIds = teamUsers.map(u => u.id);

    const [
      totalOutstanding,
      totalTransactions,
      unpaidCount,
      partialCount,
      paidCount,
      todayTransactions,
      todayPayments,
      monthPayments,
      profitToday,
      profitWeek,
      profitMonth,
      todayTxCount,
      weekTxCount,
      monthTxCount,
      debtorClients,
      recentTransactions,
      currencies,
      last7Transactions,
      topCurrencies,
      recentDepositOrders,
      last7Profit,
    ] = await Promise.all([
      Transaction.sum('amountRemaining', { where: { status: { [Op.in]: ['unpaid', 'partial'] }, userId: { [Op.in]: userIds } } }),
      Transaction.count({ where: { userId: { [Op.in]: userIds } } }),
      Transaction.count({ where: { status: 'unpaid', userId: { [Op.in]: userIds } } }),
      Transaction.count({ where: { status: 'partial', userId: { [Op.in]: userIds } } }),
      Transaction.count({ where: { status: 'paid', userId: { [Op.in]: userIds } } }),
      Transaction.count({ where: { createdAt: { [Op.between]: [today, todayEnd] }, userId: { [Op.in]: userIds } } }),
      Payment.sum('amount', { where: { createdAt: { [Op.between]: [today, todayEnd] }, userId: { [Op.in]: userIds } } }),
      Payment.sum('amount', { where: { createdAt: { [Op.between]: [monthStart, monthEnd] }, userId: { [Op.in]: userIds } } }),
      // Real profit = SUM(profit) from transactions
      Transaction.sum('profit', { where: { createdAt: { [Op.between]: [today, todayEnd] }, userId: { [Op.in]: userIds } } }),
      Transaction.sum('profit', { where: { createdAt: { [Op.between]: [weekStart, weekEnd] }, userId: { [Op.in]: userIds } } }),
      Transaction.sum('profit', { where: { createdAt: { [Op.between]: [monthStart, monthEnd] }, userId: { [Op.in]: userIds } } }),
      // Transaction counts for profit periods
      Transaction.count({ where: { createdAt: { [Op.between]: [today, todayEnd] }, userId: { [Op.in]: userIds } } }),
      Transaction.count({ where: { createdAt: { [Op.between]: [weekStart, weekEnd] }, userId: { [Op.in]: userIds } } }),
      Transaction.count({ where: { createdAt: { [Op.between]: [monthStart, monthEnd] }, userId: { [Op.in]: userIds } } }),
      Client.findAll({
        where: { totalDebt: { [Op.gt]: 0 }, isActive: true, userId: { [Op.in]: userIds } },
        order: [['totalDebt', 'DESC']],
        limit: 10,
        attributes: ['id', 'name', 'phone', 'totalDebt', 'totalPaid'],
      }),
      Transaction.findAll({
        where: { userId: { [Op.in]: userIds } },
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
      }),
      Currency.findAll({ where: { isActive: true, userId: { [Op.in]: userIds } } }),
      // Last 7 days: count + volume per day
      Transaction.findAll({
        where: { createdAt: { [Op.gte]: sevenDaysAgo }, userId: { [Op.in]: userIds } },
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
        where: { userId: { [Op.in]: userIds } },
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
        where: { userId: { [Op.in]: userIds } },
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
      }),
      // Last 7 days profit per day
      Transaction.findAll({
        where: { createdAt: { [Op.gte]: sevenDaysAgo }, userId: { [Op.in]: userIds } },
        attributes: [
          [fn('DATE', col('createdAt')), 'day'],
          [fn('SUM', col('profit')), 'profit'],
        ],
        group: [fn('DATE', col('createdAt'))],
        order: [[fn('DATE', col('createdAt')), 'ASC']],
        raw: true,
      }),
    ]);

    // Build full 7-day array (fill missing days with 0)
    const dailyChart = [];
    for (let i = 6; i >= 0; i--) {
      const day = moment().subtract(i, 'days').format('YYYY-MM-DD');
      const found = last7Transactions.find(r => r.day === day);
      const profitFound = last7Profit.find(r => r.day === day);
      dailyChart.push({
        day,
        label: moment(day).format('DD/MM'),
        count: found ? parseInt(found.count) : 0,
        volume: found ? parseFloat(found.volume) || 0 : 0,
        profit: profitFound ? parseFloat(profitFound.profit) || 0 : 0,
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
          profitToday: profitToday || 0,
          profitWeek: profitWeek || 0,
          profitMonth: profitMonth || 0,
          todayTxCount: todayTxCount || 0,
          weekTxCount: weekTxCount || 0,
          monthTxCount: monthTxCount || 0,
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
