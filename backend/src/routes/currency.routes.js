const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, getRateHistory, adjustStock, getStockSummary, getRateForPair, getRateAlerts, createRateAlert, deleteRateAlert, syncRates } = require('../controllers/currency.controller');
const { authenticate, authorize, authorizeOwner } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const validate = require('../middleware/validate.middleware');
const schemas = require('../middleware/schemas');

router.get('/', authenticate, getAll);
router.get('/stock', authenticate, getStockSummary);
router.get('/rate-for-pair', authenticate, getRateForPair);
router.get('/rate-alerts', authenticate, getRateAlerts);
router.post('/rate-alerts', authenticate, createRateAlert);
router.delete('/rate-alerts/:id', authenticate, deleteRateAlert);
router.get('/:id', authenticate, getById);
router.get('/history/:code', authenticate, getRateHistory);
router.post('/', authenticate, authorizeOwner, validate(schemas.createCurrency), auditLog('CREATE', 'currency'), create);
router.put('/:id', authenticate, authorizeOwner, validate(schemas.updateCurrency), auditLog('UPDATE', 'currency'), update);
router.put('/:id/stock', authenticate, authorizeOwner, adjustStock);
router.post('/sync-rates', authenticate, authorizeOwner, syncRates);

module.exports = router;
