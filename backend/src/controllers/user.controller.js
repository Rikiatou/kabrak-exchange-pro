const { User } = require('../models');

const getAll = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const users = await User.findAll({ where: { teamOwnerId: ownerId }, order: [['createdAt', 'DESC']] });
    return res.json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const user = await User.findOne({ where: { id: req.params.id, teamOwnerId: ownerId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required.' });
    }
    const ownerId = req.user.teamOwnerId || req.user.id;
    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use.' });
    const user = await User.create({ name, email: email.toLowerCase(), password, role: role || 'employee', phone, teamOwnerId: ownerId });
    return res.status(201).json({ success: true, message: 'User created.', data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const ownerId = req.user.teamOwnerId || req.user.id;
    const user = await User.findOne({ where: { id: req.params.id, teamOwnerId: ownerId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const { name, phone, role, isActive } = req.body;
    await user.update({ name, phone, role, isActive });
    return res.json({ success: true, message: 'User updated.', data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
    }
    const ownerId = req.user.teamOwnerId || req.user.id;
    const user = await User.findOne({ where: { id: req.params.id, teamOwnerId: ownerId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await user.update({ isActive: false });
    return res.json({ success: true, message: 'User deactivated.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
