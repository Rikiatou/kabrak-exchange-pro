const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OTP = sequelize.define('OTP', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('login', 'password_reset', 'phone_verification'),
      defaultValue: 'login',
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    tableName: 'otps',
    timestamps: true,
  });

  OTP.associate = (models) => {
    OTP.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return OTP;
};
