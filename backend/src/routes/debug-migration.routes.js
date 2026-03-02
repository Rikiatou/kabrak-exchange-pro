const express = require('express');
const router = express.Router();
const { User, Client, Currency, Alert, sequelize } = require('../models');

// Route de diagnostic pour voir les données réelles
router.get('/debug-data', async (req, res) => {
  try {
    const [clientsRaw] = await sequelize.query('SELECT id, name, "userId" FROM clients LIMIT 10');
    const [currenciesRaw] = await sequelize.query('SELECT id, code, "userId" FROM currencies LIMIT 10');
    const [alertsRaw] = await sequelize.query('SELECT id, type, "userId" FROM alerts LIMIT 10');
    const [usersRaw] = await sequelize.query('SELECT id, email, "firstName", "lastName", "teamOwnerId", "teamRole" FROM users');

    return res.json({
      success: true,
      data: {
        clients: clientsRaw,
        currencies: currenciesRaw,
        alerts: alertsRaw,
        users: usersRaw
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Route pour forcer la migration sur un owner spécifique
router.post('/force-migrate', async (req, res) => {
  try {
    const { secretToken, ownerId } = req.body;
    if (secretToken !== process.env.MIGRATION_SECRET || !process.env.MIGRATION_SECRET) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (!ownerId) {
      return res.status(400).json({ success: false, message: 'ownerId required' });
    }

    // Utiliser des requêtes SQL brutes pour être sûr
    const [clientsResult] = await sequelize.query(
      'UPDATE clients SET "userId" = :ownerId WHERE "userId" IS NULL',
      { replacements: { ownerId } }
    );

    const [currenciesResult] = await sequelize.query(
      'UPDATE currencies SET "userId" = :ownerId WHERE "userId" IS NULL',
      { replacements: { ownerId } }
    );

    const [alertsResult] = await sequelize.query(
      'UPDATE alerts SET "userId" = :ownerId WHERE "userId" IS NULL',
      { replacements: { ownerId } }
    );

    return res.json({
      success: true,
      message: 'Migration forcée terminée',
      results: {
        clientsUpdated: clientsResult,
        currenciesUpdated: currenciesResult,
        alertsUpdated: alertsResult
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
});

module.exports = router;
