const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CashBook = sequelize.define('CashBook', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  currency: { type: DataTypes.STRING(10), allowNull: false },
  openingBalance: { type: DataTypes.DECIMAL(20, 4), defaultValue: 0 },
  totalIn: { type: DataTypes.DECIMAL(20, 4), defaultValue: 0 },
  totalOut: { type: DataTypes.DECIMAL(20, 4), defaultValue: 0 },
  closingBalance: { type: DataTypes.DECIMAL(20, 4), defaultValue: 0 },
  physicalCount: { type: DataTypes.DECIMAL(20, 4), allowNull: true },
  difference: { type: DataTypes.DECIMAL(20, 4), defaultValue: 0 },
  notes: { type: DataTypes.TEXT, allowNull: true },
  isClosed: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'cashbook'
});

module.exports = (sequelize) => CashBook;
