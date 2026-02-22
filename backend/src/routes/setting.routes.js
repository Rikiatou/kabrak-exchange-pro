const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getSettings, updateSettings, getPublicSettings } = require('../controllers/setting.controller');

// PUBLIC
router.get('/public', getPublicSettings);

// PROTECTED (admin only)
router.use(authenticate);
router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
