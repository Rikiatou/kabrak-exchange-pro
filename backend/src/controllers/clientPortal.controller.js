const { Client, DepositOrder, Deposit, User } = require('../models');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const isExpoPushToken = (token) => typeof token === 'string' && /^Expo(nent)?PushToken\[.+\]$/.test(token);

const sendPush = async (token, title, body, data = {}) => {
  if (!token || !isExpoPushToken(token)) return;
  try {
    await axios.post('https://exp.host/--/api/v2/push/send', { to: token, title, body, data, sound: 'default' }, { headers: { 'Content-Type': 'application/json' } });
  } catch (_) {}
};

// GET /api/public/client/:code — get client portal data (orders + payments)
const getClientPortal = async (req, res) => {
  try {
    const client = await Client.findOne({
      where: { clientCode: req.params.code.toUpperCase(), isActive: true },
      attributes: ['id', 'clientCode', 'name', 'phone'],
    });
    if (!client) return res.status(404).json({ success: false, message: 'Code client invalide / Invalid client code' });

    const orders = await DepositOrder.findAll({
      where: { clientId: client.id, status: ['pending', 'partial', 'completed'] },
      order: [['createdAt', 'DESC']],
      include: [{
        model: Deposit,
        as: 'payments',
        attributes: ['id', 'amount', 'currency', 'status', 'receiptImageUrl', 'receiptUploadedAt', 'confirmedAt', 'createdAt'],
        order: [['createdAt', 'ASC']],
      }],
      attributes: ['id', 'reference', 'clientName', 'totalAmount', 'receivedAmount', 'remainingAmount', 'currency', 'bank', 'status', 'expoPushToken', 'createdAt'],
    });

    res.json({ success: true, data: { client, orders } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/public/client/:code/payment — client submits a payment with receipt
const submitClientPayment = async (req, res) => {
  try {
    const client = await Client.findOne({
      where: { clientCode: req.params.code.toUpperCase(), isActive: true },
    });
    if (!client) return res.status(404).json({ success: false, message: 'Code client invalide / Invalid client code' });

    const { orderId, amount, notes } = req.body;
    if (!orderId || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'orderId et montant requis / orderId and amount required' });
    }

    const order = await DepositOrder.findOne({ where: { id: orderId, clientId: client.id } });
    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable / Order not found' });
    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cette commande est déjà terminée / Order already completed' });
    }
    if (parseFloat(amount) > parseFloat(order.remainingAmount)) {
      return res.status(400).json({
        success: false,
        message: `Montant supérieur au reste dû: ${order.remainingAmount} ${order.currency}`
      });
    }

    if (!req.file) return res.status(400).json({ success: false, message: 'Reçu requis / Receipt required' });

    const imageUrl = `/uploads/receipts/${req.file.filename}`;

    const deposit = await Deposit.create({
      clientName: client.name,
      clientPhone: client.phone || null,
      amount: parseFloat(amount),
      currency: order.currency,
      bank: order.bank || null,
      notes: notes || null,
      orderId: order.id,
      userId: order.userId,
      receiptImageUrl: imageUrl,
      receiptUploadedAt: new Date(),
      status: 'receipt_uploaded',
      expoPushToken: order.expoPushToken || null,
    });

    // Notify operator
    if (order.expoPushToken) {
      await sendPush(
        order.expoPushToken,
        '📸 Nouveau versement reçu',
        `${client.name} — ${parseFloat(amount).toLocaleString('fr-FR')} ${order.currency} — Reste: ${(parseFloat(order.remainingAmount) - parseFloat(amount)).toLocaleString('fr-FR')}`,
        { orderId: order.id, depositId: deposit.id, clientCode: client.clientCode }
      );
    }

    res.status(201).json({ success: true, data: { depositId: deposit.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getClientPortal, submitClientPayment };
