const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Deposit = sequelize.define('Deposit', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  clientName: { type: DataTypes.STRING, allowNull: false },
  clientPhone: { type: DataTypes.STRING, allowNull: true },
  amount: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
  currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'FCFA' },
  bank: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'receipt_uploaded', 'confirmed', 'rejected'),
    defaultValue: 'pending'
  },
  receiptImageUrl: { type: DataTypes.STRING, allowNull: true },
  receiptUploadedAt: { type: DataTypes.DATE, allowNull: true },
  confirmedAt: { type: DataTypes.DATE, allowNull: true },
  orderId: { type: DataTypes.UUID, allowNull: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  expoPushToken: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'deposits',
  hooks: {
    beforeCreate: (deposit) => {
      if (!deposit.code) {
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const digits = '0123456789';
        const l1 = letters[Math.floor(Math.random() * letters.length)];
        const l2 = letters[Math.floor(Math.random() * letters.length)];
        const num = Math.floor(1000 + Math.random() * 9000);
        deposit.code = `${l1}${l2}${num}`;
      }
    }
  }
});

module.exports = (sequelize) => Deposit;
