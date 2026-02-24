const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getUploadMiddleware } = require('../utils/cloudinary');
const {
  createDeposit,
  getDeposits,
  getDeposit,
  getDepositByCode,
  uploadReceipt,
  confirmDeposit,
  rejectDeposit,
  savePushToken,
  getClientReceipts,
  getAllReceipts,
} = require('../controllers/deposit.controller');

const upload = getUploadMiddleware('receipts');

// PUBLIC routes (no auth — for client upload page)
router.get('/public/:code', getDepositByCode);
router.post('/public/:code/upload', upload.single('receipt'), uploadReceipt);

// PROTECTED routes (operator must be logged in)
router.use(authenticate);
router.post('/', createDeposit);
router.get('/', getDeposits);
router.get('/all-receipts', getAllReceipts);
router.get('/client-receipts/:clientName', getClientReceipts);
router.get('/:id', getDeposit);
router.put('/:id/confirm', confirmDeposit);
router.put('/:id/reject', rejectDeposit);
router.put('/:id/push-token', savePushToken);

module.exports = router;
