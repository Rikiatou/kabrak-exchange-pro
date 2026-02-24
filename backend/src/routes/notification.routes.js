const express = require('express');
const router = express.Router();
const { transactionConfirmation, paymentReminder, rateAlertNotification } = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/transaction-confirmation', transactionConfirmation);
router.post('/payment-reminder', paymentReminder);
router.post('/rate-alert', rateAlertNotification);

module.exports = router;
