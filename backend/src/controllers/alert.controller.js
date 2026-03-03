const { Alert, Client, Currency } = require('../models');
const { Op } = require('sequelize');

const getAll = async (req, res) => {
  try {
    const { isRead, severity } = req.query;
    const ownerId = req.user.teamOwnerId || req.user.id;
    const where = { userId: ownerId };
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (severity) where.severity = severity;
    const alerts = await Alert.findAll({ where, order: [['createdAt', 'DESC']], limit: 50 });
    return res.json({ success: true, data: alerts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markRead = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const alert = await Alert.findOne({ where: { id: req.params.id, userId: ownerId } });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    await alert.update({ isRead: true });
    return res.json({ success: true, message: 'Alert marked as read.', data: alert });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    await Alert.update({ isRead: true }, { where: { isRead: false, userId: ownerId } });
    return res.json({ success: true, message: 'All alerts marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const checkAndGenerateAlerts = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const generated = [];

    const debtorClients = await Client.findAll({
      where: { totalDebt: { [Op.gt]: 5000000 }, isActive: true, userId: ownerId }
    });
    for (const client of debtorClients) {
      const existing = await Alert.findOne({
        where: { entityId: client.id, type: 'debt_threshold', isRead: false, userId: ownerId }
      });
      if (!existing) {
        const alert = await Alert.create({
          type: 'debt_threshold',
          title: 'High Client Debt',
          message: `Client ${client.name} has an outstanding debt of ${parseFloat(client.totalDebt).toLocaleString()}`,
          entityId: client.id,
          entityType: 'client',
          severity: 'warning',
          userId: ownerId
        });
        generated.push(alert);
      }
    }

    const lowStockCurrencies = await Currency.findAll({
      where: { stockAmount: { [Op.lte]: Currency.sequelize.col('lowStockAlert') }, isActive: true, userId: ownerId }
    });
    for (const currency of lowStockCurrencies) {
      const existing = await Alert.findOne({
        where: { entityId: currency.id, type: 'low_stock', isRead: false, userId: ownerId }
      });
      if (!existing) {
        const alert = await Alert.create({
          type: 'low_stock',
          title: 'Low Currency Stock',
          message: `${currency.code} stock is low: ${parseFloat(currency.stockAmount).toLocaleString()} ${currency.symbol}`,
          entityId: currency.id,
          entityType: 'currency',
          severity: 'warning',
          userId: ownerId
        });
        generated.push(alert);
      }
    }

    return res.json({ success: true, message: `${generated.length} alerts generated.`, data: generated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, markRead, markAllRead, checkAndGenerateAlerts };
