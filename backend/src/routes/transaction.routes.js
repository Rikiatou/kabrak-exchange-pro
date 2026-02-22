const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, getByReference } = require('../controllers/transaction.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const validate = require('../middleware/validate.middleware');
const schemas = require('../middleware/schemas');

router.get('/', authenticate, getAll);
router.get('/ref/:reference', authenticate, getByReference);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, validate(schemas.createTransaction), auditLog('CREATE', 'transaction'), create);
router.put('/:id', authenticate, validate(schemas.updateTransaction), auditLog('UPDATE', 'transaction'), update);

module.exports = router;
