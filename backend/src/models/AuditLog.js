const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: true },
  userName: { type: DataTypes.STRING, allowNull: true },
  action: { type: DataTypes.STRING, allowNull: false },
  entity: { type: DataTypes.STRING, allowNull: false },
  entityId: { type: DataTypes.STRING, allowNull: true },
  oldValues: { type: DataTypes.TEXT, allowNull: true },
  newValues: { type: DataTypes.TEXT, allowNull: true },
  ipAddress: { type: DataTypes.STRING, allowNull: true },
  userAgent: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'audit_logs',
  updatedAt: false
});

module.exports = (sequelize) => AuditLog;
