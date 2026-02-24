const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, getRateHistory, adjustStock, getStockSummary, getRateForPair, getRateAlerts, createRateAlert, deleteRateAlert } = require('../controllers/currency.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
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
router.post('/', authenticate, authorize('admin'), validate(schemas.createCurrency), auditLog('CREATE', 'currency'), create);
router.put('/:id', authenticate, authorize('admin'), validate(schemas.updateCurrency), auditLog('UPDATE', 'currency'), update);
router.put('/:id/stock', authenticate, authorize('admin'), adjustStock);

module.exports = router;
