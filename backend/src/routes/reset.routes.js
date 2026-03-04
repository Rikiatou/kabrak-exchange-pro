const express = require('express');
const router = express.Router();
const { authenticate, authorizeOwner } = require('../middleware/auth.middleware');
const { resetAllData, resetTransactionsOnly, resetClientsOnly, resetDepositsOnly } = require('../controllers/reset.controller');

router.post('/all', authenticate, authorizeOwner, resetAllData);
router.post('/transactions', authenticate, authorizeOwner, resetTransactionsOnly);
router.post('/clients', authenticate, authorizeOwner, resetClientsOnly);
router.post('/deposits', authenticate, authorizeOwner, resetDepositsOnly);

module.exports = router;
