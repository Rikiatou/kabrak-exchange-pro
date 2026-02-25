const { Op } = require('sequelize');
const { Transaction, Client, Payment, Currency, User, Alert: AlertModel, Setting } = require('../models');

// KYC threshold: transactions above this amount (in local currency equivalent) require verified KYC
const DEFAULT_KYC_THRESHOLD = 500000; // 500,000 FCFA

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
        { model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] },
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
        { model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] },
        { model: Payment, as: 'payments', include: [{ model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] }] }
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
    const { clientId, currencyFrom, currencyTo, amountFrom, exchangeRate, type, notes, paymentMethod } = req.body;
    const dueDate = req.body.dueDate && req.body.dueDate !== '' ? req.body.dueDate : null;
    if (!clientId || !currencyFrom || !currencyTo || !amountFrom || !exchangeRate) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    const client = await Client.findByPk(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });

    const amountTo = parseFloat(amountFrom) * parseFloat(exchangeRate);

    // --- Feature 4: KYC threshold check ---
    let kycWarning = null;
    const kycThresholdSetting = await Setting.findOne({ where: { key: 'kycThreshold' } }).catch(() => null);
    const kycThreshold = kycThresholdSetting ? parseFloat(kycThresholdSetting.value) : DEFAULT_KYC_THRESHOLD;
    if (amountTo >= kycThreshold && client.kycStatus !== 'verified') {
      kycWarning = `Transaction ≥ ${kycThreshold.toLocaleString('fr-FR')} FCFA — KYC client non vérifié.`;
      await AlertModel.create({
        type: 'custom',
        title: 'Transaction sans KYC vérifié',
        message: `${client.name} (${client.clientCode}) — Transaction de ${amountTo.toLocaleString('fr-FR')} ${currencyTo} dépasse le seuil KYC (${kycThreshold.toLocaleString('fr-FR')}). Pièce d'identité non vérifiée.`,
        entityId: client.id,
        entityType: 'client',
        severity: 'warning'
      }).catch(() => {});
    }

    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reference = `TXN-${timestamp}-${random}`;

    // --- Feature 1: Profit calculation ---
    const txType = type || 'sell';
    let profit = 0;
    let profitCurrency = currencyTo;
    let marketRate = null;
    let buyRateUsed = null;
    let sellRateUsed = null;

    const currFromObj = await Currency.findOne({ where: { code: currencyFrom.toUpperCase(), isActive: true } });
    const currToObj = await Currency.findOne({ where: { code: currencyTo.toUpperCase(), isActive: true } });

    if (currFromObj && currToObj) {
      const fromBuy = parseFloat(currFromObj.buyRate || currFromObj.currentRate);
      const fromSell = parseFloat(currFromObj.sellRate || currFromObj.currentRate);
      const toBuy = parseFloat(currToObj.buyRate || currToObj.currentRate);
      const toSell = parseFloat(currToObj.sellRate || currToObj.currentRate);

      if (txType === 'sell') {
        // Bureau sells currencyFrom, receives currencyTo from client
        // Market rate = what it costs the bureau (buy rate)
        // Client rate = exchangeRate (what client gets)
        // Profit = amountFrom * (marketRate - exchangeRate) in currencyTo terms
        marketRate = toSell / fromBuy; // market sell rate
        buyRateUsed = fromBuy;
        sellRateUsed = toSell;
        profit = parseFloat(amountFrom) * (marketRate - parseFloat(exchangeRate));
        profitCurrency = currencyTo;
      } else if (txType === 'buy') {
        // Bureau buys currencyFrom from client, pays currencyTo
        marketRate = toBuy / fromSell; // market buy rate
        buyRateUsed = fromSell;
        sellRateUsed = toBuy;
        profit = parseFloat(amountFrom) * (parseFloat(exchangeRate) - marketRate);
        profitCurrency = currencyTo;
      }
      // For transfer, profit stays 0
    }

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
      type: txType,
      notes,
      dueDate,
      paymentMethod: paymentMethod || null,
      marketRate,
      buyRate: buyRateUsed,
      sellRate: sellRateUsed,
      profit: Math.round(profit * 100) / 100,
      profitCurrency
    });

    await client.update({
      totalDebt: parseFloat(client.totalDebt) + amountTo
    });

    // --- Feature 2: Auto stock update ---
    try {
      if (txType === 'sell' && currFromObj) {
        // Bureau gives currencyFrom to client → stock decreases
        const newStock = Math.max(0, parseFloat(currFromObj.stockAmount) - parseFloat(amountFrom));
        await currFromObj.update({ stockAmount: newStock });
        // Check low stock alert
        if (newStock <= parseFloat(currFromObj.lowStockAlert)) {
          const { Alert: AlertModel } = require('../models');
          await AlertModel.create({
            type: 'low_stock',
            title: `Stock bas: ${currFromObj.code}`,
            message: `Le stock de ${currFromObj.code} est à ${newStock.toLocaleString('fr-FR')} ${currFromObj.symbol}. Seuil d'alerte: ${parseFloat(currFromObj.lowStockAlert).toLocaleString('fr-FR')}`,
            entityId: currFromObj.id,
            entityType: 'currency',
            severity: newStock <= 0 ? 'critical' : 'warning'
          });
        }
      } else if (txType === 'buy' && currFromObj) {
        // Bureau receives currencyFrom from client → stock increases
        const newStock = parseFloat(currFromObj.stockAmount) + parseFloat(amountFrom);
        await currFromObj.update({ stockAmount: newStock });
      }
      if (txType === 'sell' && currToObj) {
        // Bureau receives currencyTo from client → stock increases
        const newStock = parseFloat(currToObj.stockAmount) + amountTo;
        await currToObj.update({ stockAmount: newStock });
      } else if (txType === 'buy' && currToObj) {
        // Bureau gives currencyTo to client → stock decreases
        const newStock = Math.max(0, parseFloat(currToObj.stockAmount) - amountTo);
        await currToObj.update({ stockAmount: newStock });
        if (newStock <= parseFloat(currToObj.lowStockAlert)) {
          const { Alert: AlertModel } = require('../models');
          await AlertModel.create({
            type: 'low_stock',
            title: `Stock bas: ${currToObj.code}`,
            message: `Le stock de ${currToObj.code} est à ${newStock.toLocaleString('fr-FR')} ${currToObj.symbol}. Seuil d'alerte: ${parseFloat(currToObj.lowStockAlert).toLocaleString('fr-FR')}`,
            entityId: currToObj.id,
            entityType: 'currency',
            severity: newStock <= 0 ? 'critical' : 'warning'
          });
        }
      }
    } catch (stockErr) {
      console.error('Stock update error (non-blocking):', stockErr.message);
    }

    const fullTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'phone'] },
        { model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    return res.status(201).json({ success: true, message: 'Transaction created successfully.', data: fullTransaction, kycWarning });
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
        { model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] },
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
