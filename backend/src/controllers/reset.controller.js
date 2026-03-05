const { sequelize } = require('../database/connection');
const { Transaction, Payment, Client, Deposit, DepositOrder, CashBook, CashClose, AuditLog, Alert } = require('../models');
const { Op } = require('sequelize');

/**
 * Reset all operational data for the owner's bureau.
 * Keeps: users, settings, currencies, license.
 * Deletes: transactions, payments, clients, deposits, deposit orders, cashbook, cash closes, audit logs, alerts.
 */
// Helper: get all user IDs belonging to the owner's bureau (owner + their team members)
const getTeamUserIds = async (ownerId) => {
  const [rows] = await sequelize.query(
    `SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId`,
    { replacements: { ownerId } }
  );
  return rows.map(r => r.id);
};

const resetAllData = async (req, res) => {
  const ownerId = req.user.teamOwnerId || req.user.id;
  const db = sequelize;
  const t = await db.transaction();

  try {
    // Delete in dependency order using userId (the actual column name)
    await db.query(`DELETE FROM payments WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM transactions WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM deposits WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM deposit_orders WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM cashbook WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM cash_closes WHERE "closedBy" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM alerts WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM audit_logs WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await db.query(`DELETE FROM clients WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });

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
    await sequelize.query(`DELETE FROM payments WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM transactions WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
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
    await sequelize.query(`DELETE FROM payments WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM transactions WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM deposits WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM deposit_orders WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM clients WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
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
    await sequelize.query(`DELETE FROM deposits WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await sequelize.query(`DELETE FROM deposit_orders WHERE "userId" IN (SELECT id FROM users WHERE id = :ownerId OR "teamOwnerId" = :ownerId)`, { replacements: { ownerId }, transaction: t });
    await t.commit();
    return res.json({ success: true, message: 'Deposits reset.' });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { resetAllData, resetTransactionsOnly, resetClientsOnly, resetDepositsOnly };
