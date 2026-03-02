/**
 * Script de migration pour assigner userId aux anciennes données
 * Exécuter une seule fois après le déploiement des nouveaux models
 */

const { User, Client, Transaction, Payment, Currency, Alert, CashBook, DepositOrder } = require('../models');
const { Op } = require('sequelize');

async function migrateOldData() {
  console.log('🔄 Début de la migration des anciennes données...\n');

  try {
    // 1. Récupérer tous les owners (users sans teamOwnerId)
    const owners = await User.findAll({
      where: {
        [Op.or]: [
          { teamOwnerId: null },
          { teamRole: 'owner' }
        ]
      }
    });

    console.log(`✅ Trouvé ${owners.length} propriétaires (owners)\n`);

    if (owners.length === 0) {
      console.log('⚠️  Aucun propriétaire trouvé. Rien à migrer.');
      return;
    }

    // Pour chaque owner, on va assigner ses données
    for (const owner of owners) {
      console.log(`\n📊 Migration des données pour: ${owner.email} (${owner.firstName} ${owner.lastName})`);
      console.log(`   Owner ID: ${owner.id}`);

      let stats = {
        clients: 0,
        transactions: 0,
        payments: 0,
        currencies: 0,
        alerts: 0,
        cashbooks: 0,
        depositOrders: 0
      };

      // 2. Migrer les CLIENTS sans userId
      const clientsUpdated = await Client.update(
        { userId: owner.id },
        { where: { userId: null } }
      );
      stats.clients = clientsUpdated[0];

      // 3. Migrer les TRANSACTIONS sans userId
      const transactionsUpdated = await Transaction.update(
        { userId: owner.id },
        { where: { userId: null } }
      );
      stats.transactions = transactionsUpdated[0];

      // 4. Migrer les PAYMENTS sans userId
      const paymentsUpdated = await Payment.update(
        { userId: owner.id },
        { where: { userId: null } }
      );
      stats.payments = paymentsUpdated[0];

      // 5. Migrer les CURRENCIES sans userId
      const currenciesUpdated = await Currency.update(
        { userId: owner.id },
        { where: { userId: null } }
      );
      stats.currencies = currenciesUpdated[0];

      // 6. Migrer les ALERTS sans userId
      const alertsUpdated = await Alert.update(
        { userId: owner.id },
        { where: { userId: null } }
      );
      stats.alerts = alertsUpdated[0];

      // 7. Migrer les CASHBOOKS sans userId
      const cashbooksUpdated = await CashBook.update(
        { userId: owner.id },
        { where: { userId: null } }
      );
      stats.cashbooks = cashbooksUpdated[0];

      // 8. Migrer les DEPOSIT ORDERS sans userId
      const depositOrdersUpdated = await DepositOrder.update(
        { userId: owner.id },
        { where: { userId: null } }
      );
      stats.depositOrders = depositOrdersUpdated[0];

      console.log(`   ✅ Clients: ${stats.clients}`);
      console.log(`   ✅ Transactions: ${stats.transactions}`);
      console.log(`   ✅ Paiements: ${stats.payments}`);
      console.log(`   ✅ Devises: ${stats.currencies}`);
      console.log(`   ✅ Alertes: ${stats.alerts}`);
      console.log(`   ✅ Livre de caisse: ${stats.cashbooks}`);
      console.log(`   ✅ Versements: ${stats.depositOrders}`);

      // Si c'est le premier owner et qu'il a des données, on s'arrête
      // (pour éviter d'assigner toutes les données au premier owner)
      const totalMigrated = Object.values(stats).reduce((a, b) => a + b, 0);
      if (totalMigrated > 0) {
        console.log(`\n⚠️  Données migrées vers le premier owner trouvé.`);
        console.log(`⚠️  Si vous avez plusieurs owners, vous devrez assigner manuellement les données.`);
        break;
      }
    }

    console.log('\n✅ Migration terminée avec succès !');

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter la migration
if (require.main === module) {
  migrateOldData()
    .then(() => {
      console.log('\n✅ Script terminé.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Erreur fatale:', err);
      process.exit(1);
    });
}

module.exports = { migrateOldData };
