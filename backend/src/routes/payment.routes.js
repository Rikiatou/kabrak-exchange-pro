const express = require('express');
const router = express.Router();
const { getAll, create } = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');

router.get('/', authenticate, getAll);
router.post('/', authenticate, auditLog('CREATE', 'payment'), create);

module.exports = router;
