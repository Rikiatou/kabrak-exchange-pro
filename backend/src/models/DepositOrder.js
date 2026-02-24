const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const DepositOrder = sequelize.define('DepositOrder', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  reference: { type: DataTypes.STRING(12), allowNull: false, defaultValue: '' },
  clientName: { type: DataTypes.STRING, allowNull: false },
  clientPhone: { type: DataTypes.STRING, allowNull: true },
  totalAmount: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
  receivedAmount: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
  remainingAmount: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'FCFA' },
  bank: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'partial', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  userId: { type: DataTypes.UUID, allowNull: true },
  clientId: { type: DataTypes.UUID, allowNull: true },
  expoPushToken: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'deposit_orders',
  indexes: [{ unique: true, fields: ['reference'], where: { reference: { [require('sequelize').Op.ne]: '' } } }],
  hooks: {
    beforeCreate: async (order) => {
      if (!order.reference) {
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const num = Math.floor(1000 + Math.random() * 9000);
        const l1 = letters[Math.floor(Math.random() * letters.length)];
        const l2 = letters[Math.floor(Math.random() * letters.length)];
        order.reference = `ORD-${l1}${l2}${num}`;
      }
      order.remainingAmount = order.totalAmount;
    }
  }
});

module.exports = (sequelize) => DepositOrder;
