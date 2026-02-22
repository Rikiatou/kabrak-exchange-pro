const { Op } = require('sequelize');
const { Transaction, Client, Payment, Currency, User } = require('../models');

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, clientId, currencyFrom, currencyTo, dateFrom, dateTo, amountMin, amountMax, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (currencyFrom) where.currencyFrom = currencyFrom.toUpperCase();
    if (currencyTo) where.currencyTo = currencyTo.toUpperCase();
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom + 'T00:00:00');
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo + 'T23:59:59');
    }
    if (amountMin || amountMax) {
      where.amountTo = {};
      if (amountMin) where.amountTo[Op.gte] = parseFloat(amountMin);
      if (amountMax) where.amountTo[Op.lte] = parseFloat(amountMax);
    }
    if (search) {
      where[Op.or] = [
        { reference: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } },
      ];
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Transaction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'phone'] },
        { model: User, as: 'operator', attributes: ['id', 'name'] },
        { model: Payment, as: 'payments' }
      ]
    });
    return res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'operator', attributes: ['id', 'name'] },
        { model: Payment, as: 'payments', include: [{ model: User, as: 'operator', attributes: ['id', 'name'] }] }
      ]
    });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    return res.json({ success: true, data: transaction });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { clientId, currencyFrom, currencyTo, amountFrom, exchangeRate, type, notes } = req.body;
    const dueDate = req.body.dueDate && req.body.dueDate !== '' ? req.body.dueDate : null;
    if (!clientId || !currencyFrom || !currencyTo || !amountFrom || !exchangeRate) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    const client = await Client.findByPk(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });

    const amountTo = parseFloat(amountFrom) * parseFloat(exchangeRate);
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reference = `TXN-${timestamp}-${random}`;
    const transaction = await Transaction.create({
      reference,
      clientId,
      userId: req.user.id,
      currencyFrom,
      currencyTo,
      amountFrom: parseFloat(amountFrom),
      exchangeRate: parseFloat(exchangeRate),
      amountTo,
      amountRemaining: amountTo,
      amountPaid: 0,
      status: 'unpaid',
      type: type || 'sell',
      notes,
      dueDate
    });

    await client.update({
      totalDebt: parseFloat(client.totalDebt) + amountTo
    });

    const fullTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'phone'] },
        { model: User, as: 'operator', attributes: ['id', 'name'] }
      ]
    });

    return res.status(201).json({ success: true, message: 'Transaction created successfully.', data: fullTransaction });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    if (transaction.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Cannot edit a fully paid transaction.' });
    }
    const { notes, dueDate } = req.body;
    await transaction.update({ notes, dueDate });
    return res.json({ success: true, message: 'Transaction updated.', data: transaction });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getByReference = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      where: { reference: req.params.reference },
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'operator', attributes: ['id', 'name'] },
        { model: Payment, as: 'payments' }
      ]
    });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    return res.json({ success: true, data: transaction });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getById, create, update, getByReference };
