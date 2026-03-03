const express = require('express');
const router = express.Router();
const { AuditLog } = require('../models');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const ownerId = req.user.teamOwnerId || req.user.id;
    const { count, rows } = await AuditLog.findAndCountAll({
      where: { userId: ownerId },
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });
    return res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
