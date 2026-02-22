const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  transactionId: { type: DataTypes.UUID, allowNull: false },
  clientId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  amount: { type: DataTypes.DECIMAL(20, 4), allowNull: false },
  currency: { type: DataTypes.STRING(10), allowNull: false },
  paymentMethod: { type: DataTypes.ENUM('cash', 'bank_transfer', 'mobile_money', 'other'), defaultValue: 'cash' },
  reference: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'payments'
});

module.exports = Payment;
