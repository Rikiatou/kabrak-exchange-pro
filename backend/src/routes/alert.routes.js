const express = require('express');
const router = express.Router();
const { getAll, markRead, markAllRead, checkAndGenerateAlerts } = require('../controllers/alert.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, getAll);
router.post('/check', authenticate, checkAndGenerateAlerts);
router.put('/read-all', authenticate, markAllRead);
router.put('/:id/read', authenticate, markRead);

module.exports = router;
