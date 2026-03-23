const { Op } = require('sequelize');
const { Remittance, RemittancePayment, User } = require('../models');

const getTeamUserIds = async (ownerId, sequelize) => {
  const [rows] = await sequelize.query(
    `SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId`,
    { replacements: { ownerId } }
  );
  return rows.map(r => r.id);
};

// GET /api/remittances
const getAll = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const userIds = await getTeamUserIds(ownerId, Remittance.sequelize);
    const { status, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

    const where = { userId: { [Op.in]: userIds } };
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom + 'T00:00:00');
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo + 'T23:59:59');
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Remittance.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: RemittancePayment, as: 'payments', order: [['paidAt', 'DESC']] },
        { model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    return res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / parseInt(limit)) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/remittances/:id
const getOne = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const userIds = await getTeamUserIds(ownerId, Remittance.sequelize);

    const remittance = await Remittance.findOne({
      where: { id: req.params.id, userId: { [Op.in]: userIds } },
      include: [
        { model: RemittancePayment, as: 'payments', order: [['paidAt', 'DESC']], include: [{ model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] }] },
        { model: User, as: 'operator', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    if (!remittance) return res.status(404).json({ success: false, message: 'Reversement introuvable' });
    return res.json({ success: true, data: remittance });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/remittances
const create = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const { beneficiaryName, beneficiaryPhone, totalAmount, currency, notes, dueDate } = req.body;

    if (!beneficiaryName || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Nom du partenaire et montant total requis' });
    }

    const remittance = await Remittance.create({
      beneficiaryName,
      beneficiaryBank: null,
      beneficiaryAccount: null,
      beneficiaryPhone: beneficiaryPhone || null,
      totalAmount: parseFloat(totalAmount),
      currency: currency || 'FCFA',
      notes: notes || null,
      dueDate: dueDate || null,
      userId: req.user.id,
    });

    return res.status(201).json({ success: true, data: remittance });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/remittances/:id/payments
const addPayment = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const userIds = await getTeamUserIds(ownerId, Remittance.sequelize);

    const remittance = await Remittance.findOne({
      where: { id: req.params.id, userId: { [Op.in]: userIds } },
    });

    if (!remittance) return res.status(404).json({ success: false, message: 'Reversement introuvable' });
    if (remittance.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Ce reversement est déjà complété' });
    }

    const { amount, reference, notes, paidAt } = req.body;
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Montant invalide' });
    }

    const payAmount = parseFloat(amount);
    const remaining = parseFloat(remittance.remainingAmount);

    if (payAmount > remaining) {
      return res.status(400).json({ success: false, message: `Montant dépasse le reste dû (${remaining} ${remittance.currency})` });
    }

    const payment = await RemittancePayment.create({
      remittanceId: remittance.id,
      amount: payAmount,
      reference: reference || null,
      notes: notes || null,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      userId: req.user.id,
    });

    const newPaid = parseFloat(remittance.paidAmount) + payAmount;
    const newRemaining = parseFloat(remittance.totalAmount) - newPaid;
    const newStatus = newRemaining <= 0 ? 'completed' : 'partial';

    await remittance.update({
      paidAmount: newPaid,
      remainingAmount: newRemaining <= 0 ? 0 : newRemaining,
      status: newStatus,
    });

    const updated = await Remittance.findByPk(remittance.id, {
      include: [{ model: RemittancePayment, as: 'payments', order: [['paidAt', 'DESC']] }],
    });

    return res.json({ success: true, data: updated, payment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/remittances/:id
const update = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const userIds = await getTeamUserIds(ownerId, Remittance.sequelize);

    const remittance = await Remittance.findOne({
      where: { id: req.params.id, userId: { [Op.in]: userIds } },
    });

    if (!remittance) return res.status(404).json({ success: false, message: 'Reversement introuvable' });

    const { beneficiaryName, beneficiaryBank, beneficiaryAccount, beneficiaryPhone, notes, dueDate } = req.body;
    await remittance.update({
      beneficiaryName: beneficiaryName || remittance.beneficiaryName,
      beneficiaryBank: beneficiaryBank !== undefined ? beneficiaryBank : remittance.beneficiaryBank,
      beneficiaryAccount: beneficiaryAccount !== undefined ? beneficiaryAccount : remittance.beneficiaryAccount,
      beneficiaryPhone: beneficiaryPhone !== undefined ? beneficiaryPhone : remittance.beneficiaryPhone,
      notes: notes !== undefined ? notes : remittance.notes,
      dueDate: dueDate !== undefined ? dueDate : remittance.dueDate,
    });

    return res.json({ success: true, data: remittance });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/remittances/:id
const remove = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const userIds = await getTeamUserIds(ownerId, Remittance.sequelize);

    const remittance = await Remittance.findOne({
      where: { id: req.params.id, userId: { [Op.in]: userIds } },
    });

    if (!remittance) return res.status(404).json({ success: false, message: 'Reversement introuvable' });
    await RemittancePayment.destroy({ where: { remittanceId: remittance.id } });
    await remittance.destroy();

    return res.json({ success: true, message: 'Reversement supprimé' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/remittances/stats
const getStats = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const userIds = await getTeamUserIds(ownerId, Remittance.sequelize);
    const where = { userId: { [Op.in]: userIds } };

    const [total, pending, partial, completed] = await Promise.all([
      Remittance.count({ where }),
      Remittance.count({ where: { ...where, status: 'pending' } }),
      Remittance.count({ where: { ...where, status: 'partial' } }),
      Remittance.count({ where: { ...where, status: 'completed' } }),
    ]);

    const totalDue = await Remittance.sum('remainingAmount', { where: { ...where, status: { [Op.in]: ['pending', 'partial'] } } });

    return res.json({
      success: true,
      data: { total, pending, partial, completed, totalDue: totalDue || 0 },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getOne, create, addPayment, update, remove, getStats };
