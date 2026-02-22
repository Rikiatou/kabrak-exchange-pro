const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PaymentProof = sequelize.define('PaymentProof', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    plan: {
      type: DataTypes.ENUM('trial', 'basic', 'pro', 'premium'),
      allowNull: false
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    method: {
      type: DataTypes.ENUM('ussd', 'manual'),
      defaultValue: 'ussd'
    },
    status: {
      type: DataTypes.ENUM('pending', 'validated', 'rejected', 'expired'),
      defaultValue: 'pending'
    },
    validatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    validatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h pour valider
    }
  }, {
    tableName: 'payment_proofs',
    timestamps: true
  });

  return PaymentProof;
};
