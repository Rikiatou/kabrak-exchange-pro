const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getSettings, updateSettings, getPublicSettings, uploadLogo } = require('../controllers/setting.controller');
const { upload } = require('../middleware/upload.middleware');

// PUBLIC
router.get('/public', getPublicSettings);

// PROTECTED
router.use(authenticate);
router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/upload-logo', upload.single('logo'), uploadLogo);

module.exports = router;
