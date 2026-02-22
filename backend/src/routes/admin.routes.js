const express = require('express');
const router = express.Router();
const { License } = require('../models');
const { Op } = require('sequelize');

// GET /admin/licenses — voir toutes les licences
router.get('/licenses', async (req, res) => {
  try {
    const licenses = await License.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(licenses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /admin/licenses/:id/approve — approuver une licence avec durée personnalisée
router.post('/licenses/:id/approve', async (req, res) => {
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

// POST /admin/licenses/:id/extend — étendre une licence existante
router.post('/licenses/:id/extend', async (req, res) => {
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

// POST /admin/licenses/:id/plan — changer le plan d'une licence
router.post('/licenses/:id/plan', async (req, res) => {
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

// GET /admin/licenses/stats — statistiques
router.get('/licenses/stats', async (req, res) => {
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
