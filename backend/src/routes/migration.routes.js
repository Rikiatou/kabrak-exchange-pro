const express = require('express');
const router = express.Router();
const { User, Client, Transaction, Payment, Currency, Alert, CashBook, DepositOrder } = require('../models');
const { Op } = require('sequelize');

// Route pour exécuter la migration (protégée par un token secret)
router.post('/migrate-old-data', async (req, res) => {
  try {
    // Sécurité : vérifier un token secret
    const { secretToken } = req.body;
    if (secretToken !== process.env.MIGRATION_SECRET || !process.env.MIGRATION_SECRET) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const results = {
      owners: [],
      totalMigrated: 0
    };

    // 1. Récupérer tous les owners
    const owners = await User.findAll({
      where: {
        [Op.or]: [
          { teamOwnerId: null },
          { teamRole: 'owner' }
        ]
      }
    });

    if (owners.length === 0) {
      return res.json({ success: false, message: 'Aucun propriétaire trouvé', results });
    }

    // Pour chaque owner
    for (const owner of owners) {
      const ownerStats = {
        email: owner.email,
        name: `${owner.firstName} ${owner.lastName}`,
        id: owner.id,
        clients: 0,
        transactions: 0,
        payments: 0,
        currencies: 0,
        alerts: 0,
        cashbooks: 0,
        depositOrders: 0
      };

      // Migrer les données sans userId
      const [clientsUpdated] = await Client.update({ userId: owner.id }, { where: { userId: null } });
      ownerStats.clients = clientsUpdated;

      const [transactionsUpdated] = await Transaction.update({ userId: owner.id }, { where: { userId: null } });
      ownerStats.transactions = transactionsUpdated;

      const [paymentsUpdated] = await Payment.update({ userId: owner.id }, { where: { userId: null } });
      ownerStats.payments = paymentsUpdated;

      const [currenciesUpdated] = await Currency.update({ userId: owner.id }, { where: { userId: null } });
      ownerStats.currencies = currenciesUpdated;

      const [alertsUpdated] = await Alert.update({ userId: owner.id }, { where: { userId: null } });
      ownerStats.alerts = alertsUpdated;

      const [cashbooksUpdated] = await CashBook.update({ userId: owner.id }, { where: { userId: null } });
      ownerStats.cashbooks = cashbooksUpdated;

      const [depositOrdersUpdated] = await DepositOrder.update({ userId: owner.id }, { where: { userId: null } });
      ownerStats.depositOrders = depositOrdersUpdated;

      const totalForOwner = clientsUpdated + transactionsUpdated + paymentsUpdated + 
                           currenciesUpdated + alertsUpdated + cashbooksUpdated + depositOrdersUpdated;
      
      results.totalMigrated += totalForOwner;
      results.owners.push(ownerStats);

      // Si des données ont été migrées, on s'arrête (pour éviter d'assigner tout au premier owner)
      if (totalForOwner > 0) {
        break;
      }
    }

    return res.json({
      success: true,
      message: 'Migration terminée avec succès',
      results
    });

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      error: error.stack
    });
  }
});

// Route pour vérifier l'état des données
router.get('/check-migration-status', async (req, res) => {
  try {
    const stats = {
      clientsWithoutUserId: await Client.count({ where: { userId: null } }),
      transactionsWithoutUserId: await Transaction.count({ where: { userId: null } }),
      paymentsWithoutUserId: await Payment.count({ where: { userId: null } }),
      currenciesWithoutUserId: await Currency.count({ where: { userId: null } }),
      alertsWithoutUserId: await Alert.count({ where: { userId: null } }),
      cashbooksWithoutUserId: await CashBook.count({ where: { userId: null } }),
      depositOrdersWithoutUserId: await DepositOrder.count({ where: { userId: null } }),
      totalOwners: await User.count({ where: { [Op.or]: [{ teamOwnerId: null }, { teamRole: 'owner' }] } })
    };

    const needsMigration = Object.values(stats).some((count, idx) => idx < 7 && count > 0);

    return res.json({
      success: true,
      needsMigration,
      stats
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
