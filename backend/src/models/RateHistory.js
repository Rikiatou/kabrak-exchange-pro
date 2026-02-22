const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const RateHistory = sequelize.define('RateHistory', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  currencyCode: { type: DataTypes.STRING(10), allowNull: false },
  buyRate: { type: DataTypes.DECIMAL(20, 6), allowNull: true },
  sellRate: { type: DataTypes.DECIMAL(20, 6), allowNull: true },
  rate: { type: DataTypes.DECIMAL(20, 6), allowNull: false },
  recordedBy: { type: DataTypes.UUID, allowNull: true }
}, {
  tableName: 'rate_history'
});

module.exports = (sequelize) => RateHistory;
