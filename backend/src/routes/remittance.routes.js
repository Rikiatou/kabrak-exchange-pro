const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getAll, getOne, create, addPayment, update, remove, getStats } = require('../controllers/remittance.controller');

router.use(authenticate);

router.get('/stats', getStats);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.post('/:id/payments', addPayment);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
