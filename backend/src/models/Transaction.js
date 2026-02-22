const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  reference: { type: DataTypes.STRING, allowNull: false, unique: true },
  clientId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  currencyFrom: { type: DataTypes.STRING(10), allowNull: false },
  currencyTo: { type: DataTypes.STRING(10), allowNull: false },
  amountFrom: { type: DataTypes.DECIMAL(20, 4), allowNull: false },
  exchangeRate: { type: DataTypes.DECIMAL(20, 6), allowNull: false },
  amountTo: { type: DataTypes.DECIMAL(20, 4), allowNull: false },
  amountPaid: { type: DataTypes.DECIMAL(20, 4), defaultValue: 0 },
  amountRemaining: { type: DataTypes.DECIMAL(20, 4), allowNull: false },
  status: { type: DataTypes.ENUM('unpaid', 'partial', 'paid'), defaultValue: 'unpaid' },
  type: { type: DataTypes.ENUM('buy', 'sell', 'transfer'), defaultValue: 'sell' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  dueDate: { type: DataTypes.DATE, allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'transactions',
  hooks: {
    beforeCreate: async (transaction) => {
      if (!transaction.reference) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        transaction.reference = `TXN-${timestamp}-${random}`;
      }
      transaction.amountRemaining = transaction.amountTo;
    }
  }
});

module.exports = (sequelize) => Transaction;
