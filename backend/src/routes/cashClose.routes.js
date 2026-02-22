const express = require('express');
const router = express.Router();
const { getAll, getTodaySummary, closeDay, getById } = require('../controllers/cashClose.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', getAll);
router.get('/today', getTodaySummary);
router.get('/:id', getById);
router.post('/', authorize('admin'), closeDay);

module.exports = router;
