const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { sendOTPCode, verifyOTPCode, resendOTPCode } = require('../controllers/otp.controller');

// Toutes les routes OTP nécessitent l'authentification
router.use(authenticate);

router.post('/send', sendOTPCode);
router.post('/verify', verifyOTPCode);
router.post('/resend', resendOTPCode);

module.exports = router;
