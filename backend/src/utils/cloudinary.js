const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// If Cloudinary credentials exist, use cloud storage; otherwise fallback to local disk
const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const getUploadMiddleware = (folderName = 'receipts') => {
  if (useCloudinary) {
    const storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: `kabrak/${folderName}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
        resource_type: 'auto',
      },
    });
    return multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
  }

  // Local disk fallback
  const uploadDir = path.join(__dirname, '../../uploads', folderName);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `receipt_${req.params.code}_${Date.now()}${ext}`);
    },
  });
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|pdf|webp/;
      const ok = allowed.test(path.extname(file.originalname).toLowerCase());
      ok ? cb(null, true) : cb(new Error('Only images and PDF allowed'));
    },
  });
};

// Returns the URL to store in DB
const getFileUrl = (req) => {
  if (useCloudinary && req.file?.path) {
    return req.file.path; // Cloudinary returns full URL in req.file.path
  }
  return `/uploads/receipts/${req.file?.filename}`;
};

module.exports = { getUploadMiddleware, getFileUrl, useCloudinary };
