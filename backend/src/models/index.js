const { sequelize } = require('../database/connection');

const User = require('./user.model')(sequelize);
const Client = require('./Client')(sequelize);
const Currency = require('./Currency')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const Payment = require('./Payment')(sequelize);
const CashBook = require('./CashBook')(sequelize);
const RateHistory = require('./RateHistory')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);
const Alert = require('./Alert')(sequelize);
const License = require('./License')(sequelize);
const Setting = require('./Setting')(sequelize);
const Deposit = require('./Deposit')(sequelize);
const DepositOrder = require('./DepositOrder')(sequelize);
const CashClose = require('./CashClose')(sequelize);
const PaymentProof = require('./paymentProof.model')(sequelize);
const RateAlert = require('./RateAlert')(sequelize);
const TrialRequest = require('./TrialRequest')(sequelize);
const OTP = require('./OTP')(sequelize);
const Remittance = require('./Remittance')(sequelize);
const RemittancePayment = require('./RemittancePayment')(sequelize);

// Remittance associations
User.hasMany(Remittance, { foreignKey: 'userId', as: 'remittances' });
Remittance.belongsTo(User, { foreignKey: 'userId', as: 'operator' });
Remittance.hasMany(RemittancePayment, { foreignKey: 'remittanceId', as: 'payments' });
RemittancePayment.belongsTo(Remittance, { foreignKey: 'remittanceId', as: 'remittance' });
RemittancePayment.belongsTo(User, { foreignKey: 'userId', as: 'operator' });

// User associations
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
User.hasMany(CashBook, { foreignKey: 'userId', as: 'cashbooks' });
User.hasMany(Deposit, { foreignKey: 'userId', as: 'deposits' });
User.hasMany(DepositOrder, { foreignKey: 'userId', as: 'depositOrders' });
User.hasMany(License, { foreignKey: 'userId', as: 'licenses' });
License.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(PaymentProof, { foreignKey: 'userId', as: 'paymentProofs' });
PaymentProof.belongsTo(User, { foreignKey: 'userId', as: 'user' });
DepositOrder.belongsTo(User, { foreignKey: 'userId', as: 'operator' });
Deposit.belongsTo(User, { foreignKey: 'userId', as: 'operator' });

// OTP associations
User.hasMany(OTP, { foreignKey: 'userId', as: 'otps' });
OTP.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// DepositOrder <-> Deposit associations
DepositOrder.hasMany(Deposit, { foreignKey: 'orderId', as: 'payments' });
Deposit.belongsTo(DepositOrder, { foreignKey: 'orderId', as: 'order' });

// Client associations
Client.hasMany(Transaction, { foreignKey: 'clientId', as: 'transactions' });
Client.hasMany(Payment, { foreignKey: 'clientId', as: 'payments' });
Client.hasMany(DepositOrder, { foreignKey: 'clientId', as: 'depositOrders' });
DepositOrder.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// Transaction associations
Transaction.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'operator' });
Transaction.hasMany(Payment, { foreignKey: 'transactionId', as: 'payments' });

// Payment associations
Payment.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });
Payment.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'operator' });

// CashBook associations
CashBook.belongsTo(User, { foreignKey: 'userId', as: 'operator' });

// RateHistory associations
RateHistory.belongsTo(User, { foreignKey: 'recordedBy', as: 'recorder' });

module.exports = {
  User,
  Client,
  Currency,
  Transaction,
  Payment,
  CashBook,
  RateHistory,
  AuditLog,
  Alert,
  License,
  Deposit,
  DepositOrder,
  Setting,
  CashClose,
  PaymentProof,
  RateAlert,
  TrialRequest,
  OTP,
  Remittance,
  RemittancePayment,
};
