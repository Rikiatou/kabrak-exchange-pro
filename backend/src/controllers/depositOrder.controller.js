const { DepositOrder, Deposit, User } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

const isExpoPushToken = (token) => typeof token === 'string' && /^Expo(nent)?PushToken\[.+\]$/.test(token);

const sendPush = async (token, title, body, data = {}) => {
  if (!token || !isExpoPushToken(token)) return;
  try {
    await axios.post('https://exp.host/--/api/v2/push/send', { to: token, title, body, data, sound: 'default' }, { headers: { 'Content-Type': 'application/json' } });
  } catch (_) {}
};

// Recalculate order totals after a deposit payment is confirmed/rejected
const recalcOrder = async (orderId) => {
  const order = await DepositOrder.findByPk(orderId, {
    include: [{ model: Deposit, as: 'payments' }]
  });
  if (!order) return null;

  const confirmed = order.payments.filter(p => p.status === 'confirmed');
  const receivedAmount = confirmed.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const remainingAmount = Math.max(0, parseFloat(order.totalAmount) - receivedAmount);

  let status = 'pending';
  if (receivedAmount >= parseFloat(order.totalAmount)) status = 'completed';
  else if (receivedAmount > 0) status = 'partial';

  await order.update({ receivedAmount, remainingAmount, status });

  // Return fresh order with all payments
  const fresh = await DepositOrder.findByPk(orderId, {
    include: [{ model: Deposit, as: 'payments', order: [['createdAt', 'ASC']] }]
  });
  return fresh;
};

// POST /api/deposit-orders — create order
const createOrder = async (req, res) => {
  try {
    const { clientName, clientPhone, clientId, totalAmount, currency, bank, notes, expoPushToken } = req.body;
    if (!clientName || !totalAmount || !currency) {
      return res.status(400).json({ success: false, message: 'clientName, totalAmount and currency are required' });
    }
    const order = await DepositOrder.create({
      clientName,
      clientPhone: clientPhone || null,
      clientId: clientId || null,
      totalAmount: parseFloat(totalAmount),
      currency,
      bank: bank || null,
      notes: notes || null,
      userId: req.user.id,
      expoPushToken: expoPushToken || null,
    });
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/deposit-orders — list all orders
const getOrders = async (req, res) => {
  try {
    const { status, search, clientId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (search) {
      where[Op.or] = [
        { clientName: { [Op.like]: `%${search}%` } },
        { reference: { [Op.like]: `%${search}%` } },
        { clientPhone: { [Op.like]: `%${search}%` } },
      ];
    }
    // Filter by owner (team members see their owner's orders)
    const ownerId = req.user.teamOwnerId || req.user.id;
    where.userId = ownerId;
    const orders = await DepositOrder.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'], required: false },
        { model: Deposit, as: 'payments', attributes: ['id', 'code', 'amount', 'status', 'receiptImageUrl', 'receiptUploadedAt', 'confirmedAt', 'createdAt'] }
      ],
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/deposit-orders/:id — single order with all payments
const getOrder = async (req, res) => {
  try {
    const order = await DepositOrder.findByPk(req.params.id, {
      include: [
        { model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'], required: false },
        { model: Deposit, as: 'payments', separate: true, order: [['createdAt', 'ASC']] }
      ],
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/deposit-orders/:id/payments — add a partial payment to an order
const addPayment = async (req, res) => {
  try {
    const order = await DepositOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already completed or cancelled' });
    }

    const { amount, notes } = req.body;
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    if (parseFloat(amount) > parseFloat(order.remainingAmount)) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds remaining: ${order.remainingAmount} ${order.currency}`
      });
    }

    const deposit = await Deposit.create({
      clientName: order.clientName,
      clientPhone: order.clientPhone,
      amount: parseFloat(amount),
      currency: order.currency,
      bank: order.bank,
      notes: notes || null,
      orderId: order.id,
      userId: req.user.id,
      expoPushToken: order.expoPushToken,
    });

    // Notify operator that a new payment was added to their order
    if (order.expoPushToken) {
      await sendPush(
        order.expoPushToken,
        '💰 Nouveau versement',
        `${order.clientName} — ${parseFloat(amount).toLocaleString('fr-FR')} ${order.currency} — Commande ${order.reference}`,
        { orderId: order.id, depositCode: deposit.code }
      );
    }
    // Also notify user account push token
    try {
      const owner = await User.findByPk(req.user.id, { attributes: ['id', 'expoPushToken'] });
      if (owner?.expoPushToken && owner.expoPushToken !== order.expoPushToken) {
        await sendPush(
          owner.expoPushToken,
          '💰 Versement ajouté',
          `${order.clientName} — ${parseFloat(amount).toLocaleString('fr-FR')} ${order.currency}`,
          { orderId: order.id }
        );
      }
    } catch (_) {}

    res.status(201).json({ success: true, data: deposit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/deposit-orders/:id/cancel — cancel order
const cancelOrder = async (req, res) => {
  try {
    const order = await DepositOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    await order.update({ status: 'cancelled' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  addPayment,
  cancelOrder,
  recalcOrder,
};
