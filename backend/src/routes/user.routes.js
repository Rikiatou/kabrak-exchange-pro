const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');

router.get('/', authenticate, authorize('admin'), getAll);
router.get('/:id', authenticate, authorize('admin'), getById);
router.post('/', authenticate, authorize('admin'), auditLog('CREATE', 'user'), create);
router.put('/:id', authenticate, authorize('admin'), auditLog('UPDATE', 'user'), update);
router.delete('/:id', authenticate, authorize('admin'), auditLog('DELETE', 'user'), remove);

module.exports = router;
