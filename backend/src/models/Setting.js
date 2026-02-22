const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Setting = sequelize.define('Setting', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  value: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'settings',
  timestamps: false,
});

module.exports = Setting;
