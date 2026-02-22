const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/search.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, globalSearch);

module.exports = router;
