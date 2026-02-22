const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const License = sequelize.define('License', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  businessName: { type: DataTypes.STRING, allowNull: false },
  ownerName: { type: DataTypes.STRING, allowNull: false },
  ownerEmail: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  ownerPhone: { type: DataTypes.STRING, allowNull: true },
  country: { type: DataTypes.STRING, allowNull: true },
  plan: {
    type: DataTypes.ENUM('trial', 'monthly', 'annual'),
    defaultValue: 'trial'
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'suspended', 'pending'),
    defaultValue: 'pending'
  },
  licenseKey: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  startsAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  maxUsers: { type: DataTypes.INTEGER, defaultValue: 3 },
  notes: { type: DataTypes.TEXT, allowNull: true },
  lastCheckedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'licenses'
});

module.exports = License;
