const { Op } = require('sequelize');
const { Client, Transaction, Payment } = require('../models');

const getAll = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const where = { isActive: true };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { idNumber: { [Op.like]: `%${search}%` } }
      ];
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Client.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
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
    const client = await Client.findByPk(req.params.id, {
      include: [
        { model: Transaction, as: 'transactions', order: [['createdAt', 'DESC']], limit: 10 }
      ]
    });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
    const totalTransactions = await Transaction.count({ where: { clientId: client.id } });
    const unpaidCount = await Transaction.count({ where: { clientId: client.id, status: 'unpaid' } });
    const partialCount = await Transaction.count({ where: { clientId: client.id, status: 'partial' } });
    return res.json({
      success: true,
      data: {
        ...client.toJSON(),
        stats: { totalTransactions, unpaidCount, partialCount }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, phone, email, idNumber, idType, address, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Client name is required.' });
    const client = await Client.create({ name, phone, email, idNumber, idType, address, notes });
    return res.status(201).json({ success: true, message: 'Client created successfully.', data: client });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
    const { name, phone, email, idNumber, idType, address, notes } = req.body;
    await client.update({ name, phone, email, idNumber, idType, address, notes });
    return res.json({ success: true, message: 'Client updated successfully.', data: client });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
    await client.update({ isActive: false });
    return res.json({ success: true, message: 'Client deactivated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getClientTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = { clientId: req.params.id };
    if (status) where.status = status;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Transaction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: Payment, as: 'payments' }]
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

const uploadIdPhoto = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
    const updates = {};
    if (req.files?.front?.[0]) updates.idPhotoFront = `/uploads/kyc/${req.files.front[0].filename}`;
    if (req.files?.back?.[0]) updates.idPhotoBack = `/uploads/kyc/${req.files.back[0].filename}`;
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: 'No photo provided.' });
    if (req.body.idExpiryDate) updates.idExpiryDate = req.body.idExpiryDate;
    if (req.body.idNumber) updates.idNumber = req.body.idNumber;
    if (req.body.idType) updates.idType = req.body.idType;
    updates.kycStatus = 'pending';
    await client.update(updates);
    return res.json({ success: true, message: 'ID photo(s) uploaded.', data: client });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const verifyKyc = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });
    const { status, notes } = req.body; // status: 'verified' | 'rejected'
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be 'verified' or 'rejected'." });
    }
    await client.update({
      kycStatus: status,
      kycVerifiedAt: status === 'verified' ? new Date() : null,
      kycNotes: notes || null
    });
    return res.json({ success: true, message: `KYC ${status}.`, data: client });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove, getClientTransactions, uploadIdPhoto, verifyKyc };
