const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('RemittancePayment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  remittanceId: { type: DataTypes.UUID, allowNull: false },
  amount: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
  reference: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  userId: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'remittance_payments',
});
