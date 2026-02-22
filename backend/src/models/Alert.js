const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Alert = sequelize.define('Alert', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  type: { type: DataTypes.ENUM('debt_threshold', 'low_stock', 'high_outstanding', 'rate_change', 'custom'), allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  entityId: { type: DataTypes.STRING, allowNull: true },
  entityType: { type: DataTypes.STRING, allowNull: true },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  severity: { type: DataTypes.ENUM('info', 'warning', 'critical'), defaultValue: 'info' }
}, {
  tableName: 'alerts',
  updatedAt: false
});

module.exports = (sequelize) => Alert;
