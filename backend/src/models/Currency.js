const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Currency = sequelize.define('Currency', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING(10), allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  symbol: { type: DataTypes.STRING(10), allowNull: false },
  currentRate: { type: DataTypes.DECIMAL(20, 6), allowNull: false, defaultValue: 1 },
  buyRate: { type: DataTypes.DECIMAL(20, 6), allowNull: true },
  sellRate: { type: DataTypes.DECIMAL(20, 6), allowNull: true },
  stockAmount: { type: DataTypes.DECIMAL(20, 4), defaultValue: 0 },
  lowStockAlert: { type: DataTypes.DECIMAL(20, 4), defaultValue: 1000 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isBase: { type: DataTypes.BOOLEAN, defaultValue: false },
  userId: { type: DataTypes.UUID, allowNull: true }
}, {
  tableName: 'currencies',
  indexes: [{ unique: true, fields: ['code', 'userId'] }]
});

module.exports = (sequelize) => Currency;
