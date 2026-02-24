const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getAll, getById, create, update, remove, getClientTransactions, uploadIdPhoto, verifyKyc } = require('../controllers/client.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const validate = require('../middleware/validate.middleware');
const schemas = require('../middleware/schemas');

// KYC photo upload config
const uploadDir = path.join(__dirname, '../../uploads/kyc');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `kyc_${req.params.id}_${file.fieldname}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Only images allowed (jpg, png, webp)'));
  },
});

router.get('/', authenticate, getAll);
router.get('/:id', authenticate, getById);
router.get('/:id/transactions', authenticate, getClientTransactions);
router.post('/', authenticate, validate(schemas.createClient), auditLog('CREATE', 'client'), create);
router.put('/:id', authenticate, validate(schemas.updateClient), auditLog('UPDATE', 'client'), update);
router.post('/:id/kyc-photo', authenticate, upload.fields([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }]), uploadIdPhoto);
router.put('/:id/kyc-verify', authenticate, authorize('admin'), auditLog('UPDATE', 'client'), verifyKyc);
router.delete('/:id', authenticate, authorize('admin'), auditLog('DELETE', 'client'), remove);

module.exports = router;
