const { AuditLog } = require('../models');

const auditLog = (action, entity) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      if (data && data.success) {
        try {
          await AuditLog.create({
            userId: req.user ? req.user.id : null,
            userName: req.user ? req.user.name : 'System',
            action,
            entity,
            entityId: data.data ? (data.data.id || null) : null,
            newValues: JSON.stringify(req.body),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });
        } catch (err) {
          console.error('Audit log error:', err.message);
        }
      }
      return originalJson(data);
    };
    next();
  };
};

module.exports = { auditLog };
