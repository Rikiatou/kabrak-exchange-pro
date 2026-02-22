const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, getRateHistory, adjustStock, getStockSummary } = require('../controllers/currency.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const validate = require('../middleware/validate.middleware');
const schemas = require('../middleware/schemas');

router.get('/', authenticate, getAll);
router.get('/stock', authenticate, getStockSummary);
router.get('/:id', authenticate, getById);
router.get('/history/:code', authenticate, getRateHistory);
router.post('/', authenticate, authorize('admin'), validate(schemas.createCurrency), auditLog('CREATE', 'currency'), create);
router.put('/:id', authenticate, authorize('admin'), validate(schemas.updateCurrency), auditLog('UPDATE', 'currency'), update);
router.put('/:id/stock', authenticate, authorize('admin'), adjustStock);

module.exports = router;
