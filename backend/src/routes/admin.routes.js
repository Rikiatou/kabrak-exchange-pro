const express = require('express');
const router = express.Router();
const { License, User, PaymentProof } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { adminAuth } = require('../middleware/admin.middleware');

// POST /admin/login — login admin
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Admin credentials (à remplacer par variables d'environnement)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'kabrak';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { role: 'admin', username },
      process.env.JWT_SECRET || 'kabrak-admin-secret-2026',
      { expiresIn: '24h' }
    );
    
    res.json({ success: true, token, message: 'Logged in successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/licenses — créer une nouvelle licence directement
router.post('/licenses', adminAuth, async (req, res) => {
  try {
    const crypto = require('crypto');
    const { ownerEmail, businessName, ownerName, ownerPhone, country, plan = 'annual' } = req.body;
    if (!ownerEmail || !businessName) return res.status(400).json({ error: 'ownerEmail and businessName required' });
    const licenseKey = crypto.randomBytes(8).toString('hex').toUpperCase().match(/.{4}/g).join('-');
    const days = plan === 'trial' ? 14 : plan === 'monthly' ? 30 : 365;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const license = await License.create({
      licenseKey, ownerEmail, businessName,
      ownerName: ownerName || ownerEmail,
      ownerPhone: ownerPhone || null,
      country: country || null,
      plan, status: 'active',
      startsAt: new Date(), expiresAt,
      maxUsers: 10
    });
    res.status(201).json({ success: true, data: license });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /admin/licenses — voir toutes les licences (protégé)
router.get('/licenses', adminAuth, async (req, res) => {
  try {
    const licenses = await License.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(licenses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/licenses/:id/approve — approuver une licence avec durée personnalisée (protégé)
router.post('/licenses/:id/approve', adminAuth, async (req, res) => {
  try {
    const { days = 90 } = req.body; // durée par défaut 90 jours
    const license = await License.findByPk(req.params.id);
    if (!license) return res.status(404).json({ error: 'License not found' });
    
    await license.update({
      status: 'active',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    });
    
    res.json({ success: true, license });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/licenses/:id/extend — étendre une licence existante (protégé)
router.post('/licenses/:id/extend', adminAuth, async (req, res) => {
  try {
    const { days = 30 } = req.body;
    const license = await License.findByPk(req.params.id);
    if (!license) return res.status(404).json({ error: 'License not found' });
    
    const currentExpiry = license.expiresAt || new Date();
    const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
    
    await license.update({
      expiresAt: newExpiry,
      status: 'active'
    });
    
    res.json({ success: true, license, newExpiry });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/licenses/:id/plan — changer le plan d'une licence (protégé)
router.post('/licenses/:id/plan', adminAuth, async (req, res) => {
  try {
    const { plan } = req.body; // trial, monthly, annual
    const validPlans = ['trial', 'monthly', 'annual'];
    if (!validPlans.includes(plan)) return res.status(400).json({ error: `Plan invalide. Valeurs acceptées: ${validPlans.join(', ')}` });
    const license = await License.findByPk(req.params.id);
    if (!license) return res.status(404).json({ error: 'License not found' });
    const days = plan === 'trial' ? 14 : plan === 'monthly' ? 30 : 365;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await license.update({ plan, expiresAt, status: 'active' });
    res.json({ success: true, license });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/payments/:id/validate — valider un paiement
router.post('/payments/:id/validate', adminAuth, async (req, res) => {
  try {
    const payment = await PaymentProof.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    await payment.update({ status: 'validated', validatedAt: new Date() });
    // Activate or extend license for this user
    if (payment.userId) {
      const user = await User.findByPk(payment.userId, { attributes: ['id', 'email', 'firstName', 'lastName', 'businessName'] });
      const days = payment.plan === 'trial' ? 14 : payment.plan === 'monthly' ? 30 : 365;
      const existing = await License.findOne({ where: { ownerEmail: user.email } });
      if (existing) {
        const base = existing.expiresAt > new Date() ? new Date(existing.expiresAt) : new Date();
        base.setDate(base.getDate() + days);
        await existing.update({ status: 'active', expiresAt: base });
      } else {
        const crypto = require('crypto');
        const licenseKey = crypto.randomBytes(8).toString('hex').toUpperCase().match(/.{4}/g).join('-');
        await License.create({ licenseKey, ownerEmail: user.email, businessName: user.businessName || user.email, ownerName: `${user.firstName||''} ${user.lastName||''}`.trim(), plan: payment.plan || 'monthly', status: 'active', startsAt: new Date(), expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000), maxUsers: 10 });
      }
    }
    res.json({ success: true, payment });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/payments/:id/reject — rejeter un paiement
router.post('/payments/:id/reject', adminAuth, async (req, res) => {
  try {
    const payment = await PaymentProof.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    await payment.update({ status: 'rejected' });
    res.json({ success: true, payment });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /admin/licenses/stats — statistiques (protégé)
router.get('/licenses/stats', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const total = await License.count();
    const pending = await License.count({ where: { status: 'pending' } });
    const active = await License.count({ where: { status: 'active', expiresAt: { [Op.gt]: now } } });
    
    res.json({ total, pending, active });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /licenses/check/:licenseKey — vérification pour app mobile
router.get('/licenses/check/:licenseKey', async (req, res) => {
  try {
    const { licenseKey } = req.params;
    const license = await License.findOne({ where: { licenseKey } });
    
    if (!license) {
      return res.status(404).json({ 
        active: false, 
        message: 'License not found' 
      });
    }
    
    const now = new Date();
    const isActive = license.status === 'active' && license.expiresAt && license.expiresAt > now;
    const daysLeft = license.expiresAt ? Math.ceil((license.expiresAt - now) / (1000 * 60 * 60 * 24)) : 0;
    
    res.json({
      active: isActive,
      plan: license.plan,
      expiresAt: license.expiresAt,
      daysLeft,
      businessName: license.businessName,
      message: isActive ? 'License active' : 'License expired'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /admin/dashboard — full dashboard stats
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const totalLicenses = await License.count();
    const activeLicenses = await License.count({ where: { status: 'active', expiresAt: { [Op.gt]: now } } });
    const pendingPayments = await PaymentProof.count({ where: { status: 'pending' } });
    const totalPayments = await PaymentProof.count();
    const expiringSoon = await License.count({
      where: { status: 'active', expiresAt: { [Op.between]: [now, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] } }
    });

    // Recent activity
    const recentUsers = await User.findAll({ order: [['createdAt', 'DESC']], limit: 5, attributes: ['id', 'email', 'firstName', 'lastName', 'businessName', 'createdAt'] });
    const recentPayments = await PaymentProof.findAll({
      order: [['createdAt', 'DESC']], limit: 5,
      include: [{ model: User, as: 'user', attributes: ['email', 'firstName', 'lastName', 'businessName'] }]
    });

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers },
        licenses: { total: totalLicenses, active: activeLicenses, expiringSoon },
        payments: { total: totalPayments, pending: pendingPayments },
        recentUsers,
        recentPayments
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /admin/users — list all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'businessName', 'role', 'isActive', 'teamRole', 'lastLogin', 'createdAt']
    });
    res.json({ success: true, data: users });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /admin/users/:id/toggle — activate/deactivate user
router.put('/users/:id/toggle', adminAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update({ isActive: !user.isActive });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /admin/payments — list all payment proofs
router.get('/payments', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const payments = await PaymentProof.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['email', 'firstName', 'lastName', 'businessName'] }]
    });
    res.json({ success: true, data: payments });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/reset-data — delete all transactions, clients, deposits (keep users)
router.post('/reset-data', adminAuth, async (req, res) => {
  try {
    const { Transaction, Client, Payment, Deposit, DepositOrder, CashBook, Alert, AuditLog, PaymentProof } = require('../models');
    await Payment.destroy({ where: {} });
    await Deposit.destroy({ where: {} });
    await DepositOrder.destroy({ where: {} });
    await Transaction.destroy({ where: {} });
    await CashBook.destroy({ where: {} });
    await Alert.destroy({ where: {} });
    await AuditLog.destroy({ where: {} });
    await PaymentProof.destroy({ where: {} });
    // Reset client balances
    await Client.update({ totalDebt: 0, totalPaid: 0 }, { where: {} });
    res.json({ success: true, message: 'Toutes les données ont été réinitialisées.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
