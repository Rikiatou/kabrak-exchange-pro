const crypto = require('crypto');
const { License } = require('../models');
const { Op } = require('sequelize');

const generateLicenseKey = () => {
  return crypto.randomBytes(16).toString('hex').toUpperCase().match(/.{4}/g).join('-');
};

const getExpiryDate = (plan) => {
  const now = new Date();
  if (plan === 'trial') {
    now.setDate(now.getDate() + 30);
  } else if (plan === 'monthly') {
    now.setMonth(now.getMonth() + 1);
  } else if (plan === 'annual') {
    now.setFullYear(now.getFullYear() + 1);
  }
  return now;
};

// GET /api/licenses — list all (super admin)
const getAllLicenses = async (req, res) => {
  try {
    const licenses = await License.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: licenses });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/licenses — create new license
const createLicense = async (req, res) => {
  try {
    const { businessName, ownerName, ownerEmail, ownerPhone, country, plan, maxUsers, notes } = req.body;
    if (!businessName || !ownerName || !ownerEmail) {
      return res.status(400).json({ success: false, message: 'businessName, ownerName and ownerEmail are required.' });
    }
    const licenseKey = generateLicenseKey();
    const expiresAt = getExpiryDate(plan || 'trial');
    const license = await License.create({
      businessName, ownerName, ownerEmail, ownerPhone, country,
      plan: plan || 'trial',
      status: 'active',
      licenseKey,
      expiresAt,
      maxUsers: maxUsers || 3,
      notes
    });
    res.status(201).json({ success: true, data: license });
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'A license already exists for this email.' });
    }
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/licenses/:id — get one
const getLicense = async (req, res) => {
  try {
    const license = await License.findByPk(req.params.id);
    if (!license) return res.status(404).json({ success: false, message: 'License not found.' });
    res.json({ success: true, data: license });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/licenses/:id — update license
const updateLicense = async (req, res) => {
  try {
    const license = await License.findByPk(req.params.id);
    if (!license) return res.status(404).json({ success: false, message: 'License not found.' });
    const { businessName, ownerName, ownerPhone, country, plan, status, maxUsers, notes, expiresAt } = req.body;
    if (plan && plan !== license.plan) {
      req.body.expiresAt = getExpiryDate(plan);
    }
    await license.update({ businessName, ownerName, ownerPhone, country, plan, status, maxUsers, notes, expiresAt: req.body.expiresAt || expiresAt });
    res.json({ success: true, data: license });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/licenses/:id/renew — renew license
const renewLicense = async (req, res) => {
  try {
    const license = await License.findByPk(req.params.id);
    if (!license) return res.status(404).json({ success: false, message: 'License not found.' });
    const { plan } = req.body;
    const newPlan = plan || license.plan;
    const base = license.expiresAt > new Date() ? new Date(license.expiresAt) : new Date();
    if (newPlan === 'monthly') base.setMonth(base.getMonth() + 1);
    else if (newPlan === 'annual') base.setFullYear(base.getFullYear() + 1);
    else base.setDate(base.getDate() + 30);
    await license.update({ plan: newPlan, expiresAt: base, status: 'active' });
    res.json({ success: true, data: license, message: 'License renewed successfully.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// DELETE /api/licenses/:id
const deleteLicense = async (req, res) => {
  try {
    const license = await License.findByPk(req.params.id);
    if (!license) return res.status(404).json({ success: false, message: 'License not found.' });
    await license.destroy();
    res.json({ success: true, message: 'License deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/licenses/verify — called by mobile app at login
const verifyLicense = async (req, res) => {
  try {
    const { licenseKey } = req.body;
    if (!licenseKey) return res.status(400).json({ success: false, message: 'License key is required.' });
    const license = await License.findOne({ where: { licenseKey } });
    if (!license) return res.status(404).json({ success: false, message: 'Invalid license key.' });
    const now = new Date();
    if (license.status === 'suspended') {
      return res.status(403).json({ success: false, code: 'SUSPENDED', message: 'License suspended. Please contact support.' });
    }
    if (license.expiresAt < now || license.status === 'expired') {
      await license.update({ status: 'expired' });
      return res.status(403).json({ success: false, code: 'EXPIRED', message: 'License expired. Please renew your subscription.' });
    }
    await license.update({ lastCheckedAt: now, status: 'active' });
    const daysLeft = Math.ceil((license.expiresAt - now) / (1000 * 60 * 60 * 24));
    res.json({ success: true, data: { businessName: license.businessName, plan: license.plan, expiresAt: license.expiresAt, daysLeft, maxUsers: license.maxUsers } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/licenses/request — public: request a demo/license from landing page
const requestLicense = async (req, res) => {
  try {
    const { businessName, ownerName, ownerEmail, ownerPhone, country, message } = req.body;
    if (!businessName || !ownerName || !ownerEmail) {
      return res.status(400).json({ success: false, message: 'businessName, ownerName and ownerEmail are required.' });
    }
    const existing = await License.findOne({ where: { ownerEmail } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A request already exists for this email.' });
    }
    const licenseKey = generateLicenseKey();
    const expiresAt = getExpiryDate('trial');
    await License.create({
      businessName, ownerName, ownerEmail, ownerPhone: ownerPhone || null,
      country: country || null,
      plan: 'trial',
      status: 'pending',
      licenseKey,
      expiresAt,
      maxUsers: 3,
      notes: message || null
    });
    res.status(201).json({ success: true, message: 'Your request has been received. We will contact you within 24 hours. / Votre demande a été reçue. Nous vous contacterons dans les 24 heures.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/licenses/stats — dashboard stats for admin panel
const getLicenseStats = async (req, res) => {
  try {
    const now = new Date();
    const total = await License.count();
    const active = await License.count({ where: { status: 'active', expiresAt: { [Op.gt]: now } } });
    const expired = await License.count({ where: { [Op.or]: [{ status: 'expired' }, { expiresAt: { [Op.lt]: now } }] } });
    const pending = await License.count({ where: { status: 'pending' } });
    const suspended = await License.count({ where: { status: 'suspended' } });
    const expiringSoon = await License.count({
      where: {
        status: 'active',
        expiresAt: { [Op.between]: [now, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)] }
      }
    });
    res.json({ success: true, data: { total, active, expired, pending, suspended, expiringSoon } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { getAllLicenses, createLicense, getLicense, updateLicense, renewLicense, deleteLicense, verifyLicense, requestLicense, getLicenseStats };
