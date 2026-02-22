const express = require('express');
const router = express.Router();
const { getAll, getToday, openDay, closeDay } = require('../controllers/cashbook.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');

router.get('/', authenticate, getAll);
router.get('/today', authenticate, getToday);
router.post('/open', authenticate, auditLog('OPEN_DAY', 'cashbook'), openDay);
router.put('/:id/close', authenticate, auditLog('CLOSE_DAY', 'cashbook'), closeDay);

module.exports = router;
