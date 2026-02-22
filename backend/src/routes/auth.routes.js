const express = require('express');
const router = express.Router();
const { login, getMe, changePassword, refreshToken } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const schemas = require('../middleware/schemas');

router.post('/login', validate(schemas.login), login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, validate(schemas.changePassword), changePassword);

module.exports = router;
