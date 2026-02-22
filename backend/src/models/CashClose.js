const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CashClose = sequelize.define('CashClose', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  openingBalance: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
  closingBalance: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
  totalIncome: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
  totalExpense: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
  totalPaymentsReceived: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
  totalTransactions: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalDepositsConfirmed: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
  currency: { type: DataTypes.STRING(10), defaultValue: 'FCFA' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('open', 'closed'), defaultValue: 'closed' },
  closedBy: { type: DataTypes.UUID, allowNull: false },
  summary: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'cash_closes',
});

module.exports = (sequelize) => CashClose;
