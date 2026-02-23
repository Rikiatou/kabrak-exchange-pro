const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth.middleware');
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

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/receipts');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `receipt_${req.params.code}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only images and PDF allowed'));
  },
});

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
