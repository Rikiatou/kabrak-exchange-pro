const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Setting', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING(100), allowNull: false },
  value: { type: DataTypes.TEXT, allowNull: true },
  userId: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'settings',
  timestamps: false,
  indexes: [{ unique: true, fields: ['key', 'userId'] }]
});
