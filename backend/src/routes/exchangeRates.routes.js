const express = require('express');
const router = express.Router();
const { getLiveRates, convertAmount, getSupportedCurrencies } = require('../controllers/exchangeRates.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/live', getLiveRates);
router.get('/convert', convertAmount);
router.get('/currencies', getSupportedCurrencies);

module.exports = router;
