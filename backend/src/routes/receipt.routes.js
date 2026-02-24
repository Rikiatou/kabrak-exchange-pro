const express = require('express');
const router = express.Router();
const { generateReceipt, generateReceiptHTML } = require('../controllers/receipt.controller');
const { authenticate } = require('../middleware/auth.middleware');

// PDF receipt — returns application/pdf
router.get('/:transactionId', authenticate, generateReceipt);

// HTML receipt — returns JSON with HTML string (for email embedding)
router.get('/:transactionId/html', authenticate, generateReceiptHTML);

module.exports = router;
