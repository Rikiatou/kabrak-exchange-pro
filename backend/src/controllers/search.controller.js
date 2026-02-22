const { Op } = require('sequelize');
const { Transaction, Client, Currency, Payment, DepositOrder } = require('../models');

// GET /api/search?q=...&limit=20
const globalSearch = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Requête trop courte (min 2 caractères).' });
    }
    const term = `%${q.trim()}%`;
    const lim = Math.min(parseInt(limit), 50);

    const [transactions, clients, currencies, depositOrders] = await Promise.all([
      Transaction.findAll({
        where: {
          [Op.or]: [
            { reference: { [Op.like]: term } },
            { currencyFrom: { [Op.like]: term } },
            { currencyTo: { [Op.like]: term } },
            { notes: { [Op.like]: term } },
          ],
        },
        include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
        limit: lim,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'reference', 'currencyFrom', 'currencyTo', 'amountFrom', 'amountTo', 'status', 'createdAt'],
      }),
      Client.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: term } },
            { phone: { [Op.like]: term } },
            { email: { [Op.like]: term } },
            { idNumber: { [Op.like]: term } },
          ],
        },
        limit: lim,
        order: [['name', 'ASC']],
        attributes: ['id', 'name', 'phone', 'email', 'totalDebt', 'isActive'],
      }),
      Currency.findAll({
        where: {
          [Op.or]: [
            { code: { [Op.like]: term } },
            { name: { [Op.like]: term } },
          ],
        },
        limit: 10,
        attributes: ['id', 'code', 'name', 'symbol', 'currentRate', 'stockAmount'],
      }),
      DepositOrder.findAll({
        where: {
          [Op.or]: [
            { orderCode: { [Op.like]: term } },
            { description: { [Op.like]: term } },
          ],
        },
        include: [{ model: Client, as: 'client', attributes: ['id', 'name'] }],
        limit: lim,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'orderCode', 'totalAmount', 'currency', 'status', 'createdAt'],
      }),
    ]);

    const total = transactions.length + clients.length + currencies.length + depositOrders.length;

    res.json({
      success: true,
      data: {
        query: q.trim(),
        total,
        transactions,
        clients,
        currencies,
        depositOrders,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { globalSearch };
