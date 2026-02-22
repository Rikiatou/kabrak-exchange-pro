const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const generateClientCode = () => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${l1}${l2}${digits}`;
};

const Client = sequelize.define('Client', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  clientCode: { type: DataTypes.STRING(8), allowNull: true, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  idNumber: { type: DataTypes.STRING, allowNull: true },
  idType: { type: DataTypes.ENUM('passport', 'national_id', 'driver_license', 'other'), defaultValue: 'national_id' },
  address: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  totalDebt: { type: DataTypes.DECIMAL(20, 4), defaultValue: 0 },
  totalPaid: { type: DataTypes.DECIMAL(20, 4), defaultValue: 0 }
}, {
  tableName: 'clients',
  hooks: {
    beforeCreate: async (client) => {
      if (!client.clientCode) {
        let code, exists;
        do {
          code = generateClientCode();
          exists = await Client.findOne({ where: { clientCode: code } });
        } while (exists);
        client.clientCode = code;
      }
    }
  }
});

module.exports = (sequelize) => Client;
