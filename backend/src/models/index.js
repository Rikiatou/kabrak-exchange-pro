const User = require('./user.model');
const Client = require('./Client');
const Currency = require('./Currency');
const Transaction = require('./Transaction');
const Payment = require('./Payment');
const CashBook = require('./CashBook');
const RateHistory = require('./RateHistory');
const AuditLog = require('./AuditLog');
const Alert = require('./Alert');
const License = require('./License');
const Setting = require('./Setting');
const Deposit = require('./Deposit');
const DepositOrder = require('./DepositOrder');
const CashClose = require('./CashClose');
const PaymentProof = require('./paymentProof.model');

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
};
