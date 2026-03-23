const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Remittance', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  reference: { type: DataTypes.STRING(20), allowNull: false, defaultValue: '' },
  beneficiaryName: { type: DataTypes.STRING, allowNull: false },
  beneficiaryBank: { type: DataTypes.STRING, allowNull: true },
  beneficiaryAccount: { type: DataTypes.STRING, allowNull: true },
  beneficiaryPhone: { type: DataTypes.STRING, allowNull: true },
  totalAmount: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
  paidAmount: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
  remainingAmount: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'FCFA' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  dueDate: { type: DataTypes.DATE, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'partial', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  userId: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'remittances',
  indexes: [{ unique: true, fields: ['reference'], where: { reference: { [require('sequelize').Op.ne]: '' } } }],
  hooks: {
    beforeCreate: async (remittance) => {
      if (!remittance.reference) {
        const ts = Date.now().toString(36).toUpperCase();
        const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
        remittance.reference = `REM-${ts}-${rand}`;
      }
      remittance.remainingAmount = remittance.totalAmount;
    }
  }
});
