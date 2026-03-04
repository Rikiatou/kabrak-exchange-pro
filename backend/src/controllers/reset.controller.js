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
    // Delete in dependency order to respect FK constraints
    await Payment.destroy({ where: { '$Transaction.ownerId$': ownerId }, include: [{ model: Transaction, as: 'transaction' }], transaction: t }).catch(() =>
      Payment.destroy({ where: {}, include: [], transaction: t, truncate: false })
    );

    // Use raw queries for safe cascaded delete scoped to owner
    await db.query(`DELETE FROM "Payments" WHERE "transactionId" IN (SELECT id FROM "Transactions" WHERE "ownerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM "Transactions" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM "Deposits" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM "DepositOrders" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM "CashBooks" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM "CashCloses" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM "Alerts" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM "AuditLogs" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM "Clients" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });

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
    await sequelize.query(`DELETE FROM "Payments" WHERE "transactionId" IN (SELECT id FROM "Transactions" WHERE "ownerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM "Transactions" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
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
    await sequelize.query(`DELETE FROM "Payments" WHERE "transactionId" IN (SELECT id FROM "Transactions" WHERE "ownerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM "Transactions" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM "Deposits" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM "DepositOrders" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM "Clients" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
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
    await sequelize.query(`DELETE FROM "Deposits" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM "DepositOrders" WHERE "ownerId" = :ownerId`, { replacements: { ownerId }, transaction: t });
    await t.commit();
    return res.json({ success: true, message: 'Deposits reset.' });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { resetAllData, resetTransactionsOnly, resetClientsOnly, resetDepositsOnly };
