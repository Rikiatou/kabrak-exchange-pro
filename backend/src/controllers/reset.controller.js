const { sequelize } = require('../database/connection');
const { Transaction, Payment, Client, Deposit, DepositOrder, CashBook, CashClose, AuditLog, Alert } = require('../models');
const { Op } = require('sequelize');

/**
 * Reset all operational data for the owner's bureau.
 * Keeps: users, settings, currencies, license.
 * Deletes: transactions, payments, clients, deposits, deposit orders, cashbook, cash closes, audit logs, alerts.
 */
const resetAllData = async (req, res) => {
  const ownerId = req.user.teamOwnerId || req.user.id;

  const db = sequelize;
  const t = await db.transaction();

  try {
    // Use raw queries for safe cascaded delete scoped to owner (lowercase table names)
    await db.query(`DELETE FROM payments WHERE "transactionId" IN (SELECT id FROM transactions WHERE "ownerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM transactions WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM deposits WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM deposit_orders WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM cashbook WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM cash_closes WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM alerts WHERE "userId" IN (SELECT id FROM users WHERE "teamOwnerId" = :ownerId OR id = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM audit_logs WHERE "userId" IN (SELECT id FROM users WHERE "teamOwnerId" = :ownerId OR id = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM clients WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });

    await t.commit();

    return res.json({ success: true, message: 'All data has been reset successfully.' });
  } catch (error) {
    await t.rollback();
    console.error('Reset error:', error);
    return res.status(500).json({ success: false, message: 'Reset failed.', error: error.message });
  }
};

const resetTransactionsOnly = async (req, res) => {
  const ownerId = req.user.teamOwnerId || req.user.id;
  const t = await sequelize.transaction();
  try {
    await sequelize.query(`DELETE FROM payments WHERE "transactionId" IN (SELECT id FROM transactions WHERE "ownerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM transactions WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await t.commit();
    return res.json({ success: true, message: 'Transactions reset.' });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resetClientsOnly = async (req, res) => {
  const ownerId = req.user.teamOwnerId || req.user.id;
  const t = await sequelize.transaction();
  try {
    // Must delete transactions and payments first (FK)
    await sequelize.query(`DELETE FROM payments WHERE "transactionId" IN (SELECT id FROM transactions WHERE "ownerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM transactions WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM deposits WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM deposit_orders WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM clients WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await t.commit();
    return res.json({ success: true, message: 'Clients and related data reset.' });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resetDepositsOnly = async (req, res) => {
  const ownerId = req.user.teamOwnerId || req.user.id;
  const t = await sequelize.transaction();
  try {
    await sequelize.query(`DELETE FROM deposits WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM deposit_orders WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await t.commit();
    return res.json({ success: true, message: 'Deposits reset.' });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { resetAllData, resetTransactionsOnly, resetClientsOnly, resetDepositsOnly };
