const express = require('express');
const router = express.Router();
const { License } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { adminAuth } = require('../middleware/admin.middleware');

// POST /admin/login — login admin
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Admin credentials (à remplacer par variables d'environnement)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'kabrak';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Kabrak2026!';
    
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
      plan: 'basic' // plan par défaut
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
    const { plan } = req.body; // basic, pro, premium
    const license = await License.findByPk(req.params.id);
    if (!license) return res.status(404).json({ error: 'License not found' });
    
    await license.update({ plan });
    res.json({ success: true, license });
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

module.exports = router;
