const express = require('express');
const router = express.Router();
const { login, getMe, changePassword, refreshToken } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const schemas = require('../middleware/schemas');

router.post('/register', require('../controllers/auth.controller').register);
router.post('/login', validate(schemas.login), login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, validate(schemas.changePassword), changePassword);

// Save Expo push token for push notifications
router.put('/push-token', authenticate, async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    const { User } = require('../models');
    await User.update({ expoPushToken }, { where: { id: req.user.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
