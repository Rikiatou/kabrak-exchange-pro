const express = require('express');
const router = express.Router();
const { getMonthlyReport, getClientStatement, getProfitReport } = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/monthly', authenticate, getMonthlyReport);
router.get('/profit', authenticate, getProfitReport);
router.get('/client/:clientId/statement', authenticate, getClientStatement);

module.exports = router;
