const { Transaction, Client, Payment, User } = require('../models');

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, clientId, transactionId } = req.query;
    const ownerId = req.user.teamOwnerId || req.user.id;
    const where = { userId: ownerId };
    if (clientId) where.clientId = clientId;
    if (transactionId) where.transactionId = transactionId;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Payment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name'] },
        { model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] },
        { model: Transaction, as: 'transaction', attributes: ['id', 'reference', 'amountTo', 'currencyTo'] }
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

const create = async (req, res) => {
  try {
    const { transactionId, amount, currency, paymentMethod, reference, notes } = req.body;
    if (!transactionId || !amount || !currency) {
      return res.status(400).json({ success: false, message: 'transactionId, amount and currency are required.' });
    }

    const ownerId = req.user.teamOwnerId || req.user.id;
    const transaction = await Transaction.findOne({ where: { id: transactionId, userId: ownerId } });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    if (transaction.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Transaction is already fully paid.' });
    }

    const payAmount = parseFloat(amount);
    const remaining = parseFloat(transaction.amountRemaining);

    if (payAmount > remaining) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining balance. Max: ${remaining} ${currency}`
      });
    }

    const payment = await Payment.create({
      transactionId,
      clientId: transaction.clientId,
      userId: ownerId,
      amount: payAmount,
      currency,
      paymentMethod: paymentMethod || 'cash',
      reference,
      notes
    });

    const newPaid = parseFloat(transaction.amountPaid) + payAmount;
    const newRemaining = remaining - payAmount;
    let newStatus = 'partial';
    if (newRemaining <= 0) {
      newStatus = 'paid';
    }

    await transaction.update({
      amountPaid: newPaid,
      amountRemaining: newRemaining < 0 ? 0 : newRemaining,
      status: newStatus,
      paidAt: newStatus === 'paid' ? new Date() : null
    });

    const client = await Client.findByPk(transaction.clientId);
    if (client) {
      await client.update({
        totalPaid: parseFloat(client.totalPaid) + payAmount,
        totalDebt: Math.max(0, parseFloat(client.totalDebt) - payAmount)
      });
    }

    const fullPayment = await Payment.findByPk(payment.id, {
      include: [
        { model: Transaction, as: 'transaction' },
        { model: Client, as: 'client', attributes: ['id', 'name'] },
        { model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    // Send push notification to operator and owner
    try {
      const { notifyPayment } = require('../utils/pushNotifications');
      const { User } = require('../models');
      const tokens = new Set();
      
      // Add operator token
      if (req.user.expoPushToken) {
        tokens.add(req.user.expoPushToken);
      }
      
      // Add owner token if operator is a team member
      if (req.user.teamOwnerId) {
        const owner = await User.findByPk(req.user.teamOwnerId, { attributes: ['id', 'expoPushToken'] });
        if (owner?.expoPushToken) {
          tokens.add(owner.expoPushToken);
        }
      }
      
      if (tokens.size > 0) {
        await notifyPayment(fullPayment, transaction, client, [...tokens]);
      }
    } catch (pushErr) {
      console.error('Push notification error (non-blocking):', pushErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Payment recorded. Transaction is now ${newStatus}.`,
      data: fullPayment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, create };
