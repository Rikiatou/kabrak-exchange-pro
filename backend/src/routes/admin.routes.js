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

// POST /admin/licenses/:id/approve — approuver une licence
router.post('/licenses/:id/approve', async (req, res) => {
  try {
    const license = await License.findByPk(req.params.id);
    if (!license) return res.status(404).json({ error: 'License not found' });
    
    await license.update({
      status: 'active',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 jours
    });
    
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

module.exports = router;
