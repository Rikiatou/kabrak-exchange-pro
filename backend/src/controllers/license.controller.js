const crypto = require('crypto');
const { Resend } = require('resend');
const { License, TrialRequest } = require('../models');
const { Op } = require('sequelize');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendNotificationEmail = async ({ businessName, ownerName, ownerEmail, ownerPhone, country, message }) => {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({
      from: 'KABRAK Exchange Pro <noreply@exchange.kabrakeng.com>',
      to: process.env.NOTIFY_EMAIL || 'kabrakeng@gmail.com',
      subject: `🔔 Nouvelle demande de licence — ${businessName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#071a12;color:#fff;padding:30px;border-radius:12px">
          <h2 style="color:#e8a020;margin-bottom:20px">🔔 Nouvelle demande de licence</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#9ca3af;width:140px">Bureau de change</td><td style="padding:8px 0;font-weight:bold">${businessName}</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af">Nom</td><td style="padding:8px 0">${ownerName}</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af">Email</td><td style="padding:8px 0"><a href="mailto:${ownerEmail}" style="color:#0B6E4F">${ownerEmail}</a></td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af">Téléphone</td><td style="padding:8px 0"><a href="https://wa.me/${(ownerPhone||'').replace(/[^0-9]/g,'')}" style="color:#25D366">${ownerPhone || '-'}</a></td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af">Pays</td><td style="padding:8px 0">${country || '-'}</td></tr>
            ${message ? `<tr><td style="padding:8px 0;color:#9ca3af">Message</td><td style="padding:8px 0">${message}</td></tr>` : ''}
          </table>
          <div style="margin-top:24px;padding:16px;background:rgba(11,110,79,0.2);border-radius:8px">
            <p style="margin:0;font-size:13px;color:#9ca3af">Réponds directement à cet email ou contacte le client sur WhatsApp.</p>
          </div>
        </div>
      `,
    });
  } catch (e) {
    console.error('Email notification failed:', e.message);
  }
};

const generateLicenseKey = () => {
  return crypto.randomBytes(16).toString('hex').toUpperCase().match(/.{4}/g).join('-');
};

const getExpiryDate = (plan) => {
  const now = new Date();
  if (plan === 'trial') {
    now.setDate(now.getDate() + 14);
  } else if (plan === 'monthly') {
    now.setMonth(now.getMonth() + 1);
  } else if (plan === 'annual') {
    now.setFullYear(now.getFullYear() + 1);
  }
  return now;
};

// Check if email is from disposable/temporary email service
const isDisposableEmail = (email) => {
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
    'yopmail.com', 'temp-mail.org', 'throwaway.email', 'maildrop.cc',
    'tempmail.org', 'fakeinbox.com', 'tempmailaddress.com', 'nowmymail.com',
    'mailnesia.com', 'spamgourmet.com', 'mintemail.com', 'trashmail.com'
  ];
  const domain = email.toLowerCase().split('@')[1];
  return disposableDomains.some(d => domain.includes(d));
};

// Extract base email from common patterns (e.g., user+1@gmail.com -> user@gmail.com)
const getBaseEmail = (email) => {
  const [localPart, domain] = email.toLowerCase().split('@');
  const baseLocal = localPart.split('+')[0];
  return `${baseLocal}@${domain}`;
};

// Check for trial abuse
const checkTrialAbuse = async (email, deviceId, ipAddress) => {
  const baseEmail = getBaseEmail(email);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Check 1: Same base email had a trial in last 30 days
  const existingTrial = await TrialRequest.findOne({
    where: {
      email: { [Op.like]: `%${baseEmail.split('@')[0]}%@${baseEmail.split('@')[1]}` },
      status: { [Op.in]: ['pending', 'approved'] },
      createdAt: { [Op.gte]: thirtyDaysAgo }
    }
  });
  
  if (existingTrial) {
    return { allowed: false, reason: 'EMAIL_ALREADY_USED', message: 'Cet email a déjà été utilisé pour un essai récent.' };
  }
  
  // Check 2: Same device ID had a trial in last 30 days
  if (deviceId) {
    const deviceTrial = await TrialRequest.findOne({
      where: {
        deviceId,
        status: { [Op.in]: ['pending', 'approved'] },
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });
    
    if (deviceTrial) {
      return { allowed: false, reason: 'DEVICE_LIMIT', message: 'Un essai a déjà été créé depuis cet appareil.' };
    }
  }
  
  // Check 3: Same IP had more than 3 trials in last 30 days
  if (ipAddress) {
    const ipTrials = await TrialRequest.count({
      where: {
        ipAddress,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });
    
    if (ipTrials >= 3) {
      return { allowed: false, reason: 'IP_LIMIT', message: 'Trop de demandes depuis cette adresse.' };
    }
  }
  
  return { allowed: true };
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
    const { businessName, ownerName, ownerEmail, ownerPhone, country, message, deviceId } = req.body;
    if (!businessName || !ownerName || !ownerEmail) {
      return res.status(400).json({ success: false, message: 'businessName, ownerName and ownerEmail are required.' });
    }

    // Get client IP
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || null;

    // Check for disposable email
    if (isDisposableEmail(ownerEmail)) {
      await TrialRequest.create({
        email: ownerEmail,
        deviceId,
        ipAddress,
        userAgent: req.headers['user-agent'],
        status: 'rejected',
        rejectionReason: 'DISPOSABLE_EMAIL'
      });
      return res.status(400).json({ success: false, message: 'Veuillez utiliser une adresse email professionnelle.' });
    }

    // Check for trial abuse
    const abuseCheck = await checkTrialAbuse(ownerEmail, deviceId, ipAddress);
    if (!abuseCheck.allowed) {
      await TrialRequest.create({
        email: ownerEmail,
        deviceId,
        ipAddress,
        userAgent: req.headers['user-agent'],
        status: 'rejected',
        rejectionReason: abuseCheck.reason
      });
      return res.status(429).json({ success: false, message: abuseCheck.message, reason: abuseCheck.reason });
    }

    // Create trial request record
    const trialRequest = await TrialRequest.create({
      email: ownerEmail,
      deviceId,
      ipAddress,
      userAgent: req.headers['user-agent'],
      status: 'pending'
    });

    // Create license
    const licenseKey = generateLicenseKey();
    const expiresAt = getExpiryDate('trial');
    const license = await License.create({
      businessName, ownerName, ownerEmail, ownerPhone: ownerPhone || null,
      country: country || null,
      plan: 'trial',
      status: 'active',
      licenseKey,
      expiresAt,
      maxUsers: 3,
      notes: message || null
    });

    // Update trial request with license ID
    await trialRequest.update({ licenseId: license.id, status: 'approved', approvedAt: new Date() });

    res.status(201).json({ success: true, data: { licenseKey }, message: 'Votre essai gratuit de 14 jours est activé !' });
    sendNotificationEmail({ businessName, ownerName, ownerEmail, ownerPhone, country, message });
  } catch (e) {
    console.error('License request error:', e);
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
