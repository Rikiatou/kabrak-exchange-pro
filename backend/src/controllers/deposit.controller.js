const { Deposit, User, DepositOrder, Client } = require('../models');
const { recalcOrder } = require('./depositOrder.controller');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const isExpoPushToken = (token) => typeof token === 'string' && /^Expo(nent)?PushToken\[.+\]$/.test(token);

const sendPushNotification = async (token, title, body, data = {}) => {
  if (!token || !isExpoPushToken(token)) return;
  try {
    await axios.post('https://exp.host/--/api/v2/push/send', { to: token, title, body, data, sound: 'default' }, { headers: { 'Content-Type': 'application/json' } });
  } catch (_) {}
};

// POST /api/deposits — create new deposit (operator, auth required)
const createDeposit = async (req, res) => {
  try {
    const { clientName, clientPhone, amount, currency, bank, notes } = req.body;
    if (!clientName || !amount || !currency) {
      return res.status(400).json({ success: false, message: 'clientName, amount and currency are required' });
    }
    const deposit = await Deposit.create({
      clientName,
      clientPhone: clientPhone || null,
      amount,
      currency,
      bank: bank || null,
      notes: notes || null,
      userId: req.user.id,
      expoPushToken: req.body.expoPushToken || null,
    });
    res.status(201).json({ success: true, data: deposit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/deposits — list all deposits (operator, auth required)
const getDeposits = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { clientName: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { clientPhone: { [Op.like]: `%${search}%` } },
      ];
    }
    const deposits = await Deposit.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'operator', attributes: ['id', 'name'] }],
    });
    res.json({ success: true, data: deposits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/deposits/:id — get single deposit (auth required)
const getDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findByPk(req.params.id, {
      include: [{ model: User, as: 'operator', attributes: ['id', 'name'] }],
    });
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });
    res.json({ success: true, data: deposit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/deposits/public/:code — get deposit by code (PUBLIC, no auth — for upload page)
const getDepositByCode = async (req, res) => {
  try {
    const deposit = await Deposit.findOne({ where: { code: req.params.code.toUpperCase() } });
    if (!deposit) return res.status(404).json({ success: false, message: 'Code invalide / Invalid code' });
    if (deposit.status === 'confirmed') {
      return res.status(400).json({ success: false, message: 'Ce dépôt a déjà été confirmé / Already confirmed' });
    }
    res.json({
      success: true,
      data: {
        code: deposit.code,
        clientName: deposit.clientName,
        amount: deposit.amount,
        currency: deposit.currency,
        bank: deposit.bank,
        status: deposit.status,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/deposits/public/:code/upload — upload receipt image (PUBLIC, no auth)
const uploadReceipt = async (req, res) => {
  try {
    const deposit = await Deposit.findOne({ where: { code: req.params.code.toUpperCase() } });
    if (!deposit) return res.status(404).json({ success: false, message: 'Code invalide / Invalid code' });
    if (deposit.status === 'confirmed') {
      return res.status(400).json({ success: false, message: 'Ce dépôt a déjà été confirmé / Already confirmed' });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const imageUrl = `/uploads/receipts/${req.file.filename}`;
    await deposit.update({
      receiptImageUrl: imageUrl,
      receiptUploadedAt: new Date(),
      status: 'receipt_uploaded',
    });

    // Notify operator via deposit push token
    if (deposit.expoPushToken) {
      await sendPushNotification(
        deposit.expoPushToken,
        '📸 Reçu reçu / Receipt received',
        `${deposit.clientName} — ${deposit.amount} ${deposit.currency} — Code: ${deposit.code}`,
        { depositId: deposit.id, code: deposit.code }
      );
    }

    // Also notify the User owner via their account push token
    if (deposit.userId) {
      try {
        const owner = await User.findByPk(deposit.userId, { attributes: ['id', 'expoPushToken'] });
        if (owner?.expoPushToken && owner.expoPushToken !== deposit.expoPushToken) {
          await sendPushNotification(
            owner.expoPushToken,
            '📸 Nouveau reçu uploadé',
            `${deposit.clientName} a uploadé un reçu — ${deposit.amount} ${deposit.currency}`,
            { depositId: deposit.id, code: deposit.code }
          );
        }
      } catch (_) {}
    }

    res.json({ success: true, message: 'Reçu uploadé avec succès / Receipt uploaded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/deposits/:id/confirm — confirm deposit (operator, auth required)
const confirmDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findByPk(req.params.id);
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });
    await deposit.update({ status: 'confirmed', confirmedAt: new Date() });
    if (deposit.orderId) await recalcOrder(deposit.orderId);
    res.json({ success: true, data: deposit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/deposits/:id/reject — reject deposit (operator, auth required)
const rejectDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findByPk(req.params.id);
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });
    await deposit.update({ status: 'rejected' });
    if (deposit.orderId) await recalcOrder(deposit.orderId);
    res.json({ success: true, data: deposit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/deposits/:id/push-token — save operator push token (auth required)
const savePushToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    const deposit = await Deposit.findByPk(req.params.id);
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit not found' });
    await deposit.update({ expoPushToken });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/deposits/client-receipts/:clientName — get all receipts for a client
const getClientReceipts = async (req, res) => {
  try {
    const { clientName } = req.params;
    const deposits = await Deposit.findAll({
      where: {
        clientName: { [Op.like]: `%${clientName}%` },
        receiptImageUrl: { [Op.ne]: null },
      },
      attributes: ['id', 'code', 'clientName', 'amount', 'currency', 'status', 'receiptImageUrl', 'receiptUploadedAt', 'createdAt'],
      order: [['receiptUploadedAt', 'DESC']],
    });
    res.json({ success: true, data: deposits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/deposits/all-receipts — get all receipts grouped by client
const getAllReceipts = async (req, res) => {
  try {
    const deposits = await Deposit.findAll({
      where: { receiptImageUrl: { [Op.ne]: null } },
      attributes: ['id', 'code', 'clientName', 'amount', 'currency', 'status', 'receiptImageUrl', 'receiptUploadedAt', 'createdAt'],
      order: [['receiptUploadedAt', 'DESC']],
    });

    // Group by clientName
    const grouped = {};
    deposits.forEach(d => {
      const name = d.clientName;
      if (!grouped[name]) grouped[name] = { clientName: name, receipts: [], total: 0 };
      grouped[name].receipts.push(d);
      grouped[name].total += 1;
    });

    res.json({ success: true, data: Object.values(grouped) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createDeposit,
  getDeposits,
  getDeposit,
  getDepositByCode,
  uploadReceipt,
  confirmDeposit,
  rejectDeposit,
  savePushToken,
  getClientReceipts,
  getAllReceipts,
};
