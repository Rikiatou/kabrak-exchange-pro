const express = require('express');
const router = express.Router();
const { exportTransactions, exportDepositOrders, exportClients } = require('../controllers/export.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/transactions', exportTransactions);
router.get('/deposit-orders', exportDepositOrders);
router.get('/clients', exportClients);

module.exports = router;
