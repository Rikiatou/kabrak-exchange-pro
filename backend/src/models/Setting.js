const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Setting', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  value: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'settings',
  timestamps: false,
});
