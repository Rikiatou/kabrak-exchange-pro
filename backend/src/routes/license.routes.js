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

module.exports = router;
