const { Op } = require('sequelize');
const { CashBook, User } = require('../models');
const moment = require('moment');

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, currency, startDate, endDate } = req.query;
    const ownerId = req.user.teamOwnerId || req.user.id;
    
    // Get all user IDs in this bureau
    const [teamUsers] = await CashBook.sequelize.query(
      `SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId`,
      { replacements: { ownerId } }
    );
    const userIds = teamUsers.map(u => u.id);
    
    const where = { userId: { [Op.in]: userIds } };
    if (currency) where.currency = currency;
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await CashBook.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['date', 'DESC']],
      include: [{ model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] }]
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

const getToday = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const today = moment().format('YYYY-MM-DD');
    
    // Get all user IDs in this bureau
    const [teamUsers] = await CashBook.sequelize.query(
      `SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId`,
      { replacements: { ownerId } }
    );
    const userIds = teamUsers.map(u => u.id);
    
    const entries = await CashBook.findAll({
      where: { date: today, userId: { [Op.in]: userIds } },
      include: [{ model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] }]
    });
    return res.json({ success: true, data: entries });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const openDay = async (req, res) => {
  try {
    const { currency, openingBalance } = req.body;
    if (!currency) return res.status(400).json({ success: false, message: 'Currency is required.' });
    const ownerId = req.user.teamOwnerId || req.user.id;
    const today = moment().format('YYYY-MM-DD');
    const existing = await CashBook.findOne({ where: { date: today, currency, userId: ownerId } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Cashbook for ${currency} on ${today} already exists.` });
    }
    const entry = await CashBook.create({
      userId: ownerId,
      date: today,
      currency,
      openingBalance: parseFloat(openingBalance) || 0,
      totalIn: 0,
      totalOut: 0,
      closingBalance: parseFloat(openingBalance) || 0
    });
    return res.status(201).json({ success: true, message: 'Day opened.', data: entry });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const closeDay = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const entry = await CashBook.findOne({ where: { id: req.params.id, userId: ownerId } });
    if (!entry) return res.status(404).json({ success: false, message: 'Cashbook entry not found.' });
    const { physicalCount, notes } = req.body;
    const closingBalance = parseFloat(entry.openingBalance) + parseFloat(entry.totalIn) - parseFloat(entry.totalOut);
    const difference = physicalCount ? parseFloat(physicalCount) - closingBalance : 0;
    await entry.update({
      closingBalance,
      physicalCount: physicalCount ? parseFloat(physicalCount) : null,
      difference,
      notes,
      isClosed: true
    });
    return res.json({ success: true, message: 'Day closed.', data: entry });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getToday, openDay, closeDay };
