const Joi = require('joi');

// Auth
exports.login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(4).required(),
});

exports.changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

// Transactions
exports.createTransaction = Joi.object({
  clientId: Joi.string().uuid().required(),
  currencyFrom: Joi.string().max(10).required(),
  currencyTo: Joi.string().max(10).required(),
  amountFrom: Joi.number().positive().required(),
  amountTo: Joi.number().positive().required(),
  exchangeRate: Joi.number().positive().required(),
  type: Joi.string().valid('buy', 'sell', 'exchange').required(),
  notes: Joi.string().max(500).allow('', null),
});

exports.updateTransaction = Joi.object({
  notes: Joi.string().max(500).allow('', null),
  status: Joi.string().valid('unpaid', 'partial', 'paid', 'cancelled'),
});

// Payments
exports.createPayment = Joi.object({
  transactionId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().max(10).required(),
  paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'mobile_money', 'other').required(),
  notes: Joi.string().max(500).allow('', null),
});

// Clients
exports.createClient = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().max(20).allow('', null),
  email: Joi.string().email().allow('', null),
  idNumber: Joi.string().max(50).allow('', null),
  idType: Joi.string().valid('passport', 'national_id', 'driver_license', 'other').default('national_id'),
  address: Joi.string().max(200).allow('', null),
  notes: Joi.string().max(500).allow('', null),
});

exports.updateClient = exports.createClient.fork(['name'], (schema) => schema.optional());

// Currencies
exports.createCurrency = Joi.object({
  code: Joi.string().min(2).max(10).uppercase().required(),
  name: Joi.string().max(100).required(),
  symbol: Joi.string().max(10).allow('', null),
  buyRate: Joi.number().positive().required(),
  sellRate: Joi.number().positive().required(),
  isActive: Joi.boolean().default(true),
});

exports.updateCurrency = Joi.object({
  name: Joi.string().max(100),
  symbol: Joi.string().max(10).allow('', null),
  buyRate: Joi.number().positive(),
  sellRate: Joi.number().positive(),
  isActive: Joi.boolean(),
});

// Deposit Orders
exports.createDepositOrder = Joi.object({
  clientName: Joi.string().min(2).max(100).required(),
  clientPhone: Joi.string().max(20).allow('', null),
  clientId: Joi.string().uuid().allow(null),
  totalAmount: Joi.number().positive().required(),
  currency: Joi.string().max(10).required(),
  bank: Joi.string().max(100).allow('', null),
  notes: Joi.string().max(500).allow('', null),
  expoPushToken: Joi.string().allow('', null),
  amountForeign: Joi.number().allow(null),
  foreignCurrency: Joi.string().max(10).allow('', null),
  rate: Joi.number().allow(null),
});

exports.addDepositPayment = Joi.object({
  amount: Joi.number().positive().required(),
  notes: Joi.string().max(500).allow('', null),
});

// CashBook
exports.createCashbookEntry = Joi.object({
  type: Joi.string().valid('income', 'expense').required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().max(10).required(),
  category: Joi.string().max(100).required(),
  description: Joi.string().max(500).allow('', null),
  date: Joi.date().allow(null),
});

// Settings
exports.updateSettings = Joi.object({
  businessName: Joi.string().min(2).max(100),
  businessPhone: Joi.string().max(30).allow('', null),
  businessAddress: Joi.string().max(200).allow('', null),
  businessEmail: Joi.string().email().allow('', null),
}).min(1);

// Users
exports.createUser = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'user').default('user'),
});
