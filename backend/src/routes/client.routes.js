const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, getClientTransactions } = require('../controllers/client.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const validate = require('../middleware/validate.middleware');
const schemas = require('../middleware/schemas');

router.get('/', authenticate, getAll);
router.get('/:id', authenticate, getById);
router.get('/:id/transactions', authenticate, getClientTransactions);
router.post('/', authenticate, validate(schemas.createClient), auditLog('CREATE', 'client'), create);
router.put('/:id', authenticate, validate(schemas.updateClient), auditLog('UPDATE', 'client'), update);
router.delete('/:id', authenticate, authorize('admin'), auditLog('DELETE', 'client'), remove);

module.exports = router;
