const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  createOrder,
  getOrders,
  getOrder,
  addPayment,
  deletePayment,
  cancelOrder,
} = require('../controllers/depositOrder.controller');
const validate = require('../middleware/validate.middleware');
const schemas = require('../middleware/schemas');

router.use(authenticate);

router.post('/', validate(schemas.createDepositOrder), createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/:id/payments', validate(schemas.addDepositPayment), addPayment);
router.put('/:id/cancel', cancelOrder);
router.delete('/:orderId/payments/:paymentId', deletePayment);

module.exports = router;
