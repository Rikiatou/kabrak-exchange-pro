const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const TrialRequest = sequelize.define('TrialRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false },
  deviceId: { type: DataTypes.STRING, allowNull: true },
  ipAddress: { type: DataTypes.STRING, allowNull: true },
  userAgent: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'),
    defaultValue: 'pending'
  },
  rejectionReason: { type: DataTypes.STRING, allowNull: true },
  approvedAt: { type: DataTypes.DATE, allowNull: true },
  licenseId: { type: DataTypes.UUID, allowNull: true }
}, {
  tableName: 'trial_requests',
  indexes: [
    { fields: ['email'] },
    { fields: ['deviceId'] },
    { fields: ['ipAddress'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = (sequelize) => TrialRequest;
