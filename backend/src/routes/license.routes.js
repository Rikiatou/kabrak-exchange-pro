const express = require('express');
const router = express.Router();
const {
  getAllLicenses, createLicense, getLicense, updateLicense,
  renewLicense, deleteLicense, verifyLicense, requestLicense, getLicenseStats
} = require('../controllers/license.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Public routes (no auth required)
router.post('/verify', verifyLicense);
router.post('/request', requestLicense);

// Admin-only routes
router.get('/', authenticate, authorize('admin'), getAllLicenses);
router.get('/stats', authenticate, authorize('admin'), getLicenseStats);
router.post('/', authenticate, authorize('admin'), createLicense);
router.get('/:id', authenticate, authorize('admin'), getLicense);
router.put('/:id', authenticate, authorize('admin'), updateLicense);
router.post('/:id/renew', authenticate, authorize('admin'), renewLicense);
router.delete('/:id', authenticate, authorize('admin'), deleteLicense);

// GET /api/licenses/check/:licenseKey — vérification pour app mobile
router.get('/check/:licenseKey', async (req, res) => {
  try {
    const { licenseKey } = req.params;
    const { License } = require('../models');
    const { Op } = require('sequelize');
    
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
