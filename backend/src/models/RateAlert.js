const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const RateAlert = sequelize.define('RateAlert', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  currencyCode: { type: DataTypes.STRING(10), allowNull: false },
  condition: { type: DataTypes.ENUM('above', 'below'), allowNull: false },
  threshold: { type: DataTypes.DECIMAL(20, 6), allowNull: false },
  rateType: { type: DataTypes.ENUM('currentRate', 'buyRate', 'sellRate'), defaultValue: 'currentRate' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  lastTriggeredAt: { type: DataTypes.DATE, allowNull: true },
  userId: { type: DataTypes.UUID, allowNull: true },
  notes: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'rate_alerts'
});

module.exports = (sequelize) => RateAlert;
