require('dotenv').config();
const { sequelize } = require('./connection');
const { User, Currency, Client } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Database synced.');

    const adminExists = await User.findOne({ where: { email: process.env.ADMIN_EMAIL || 'admin@exchange.com' } });
    if (!adminExists) {
      await User.create({
        name: process.env.ADMIN_NAME || 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@exchange.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@1234',
        role: 'admin'
      });
      console.log('Admin user created.');
    }

    const currencies = [
      { code: 'EUR', name: 'Euro', symbol: '€', currentRate: 1, buyRate: 0.998, sellRate: 1.002, stockAmount: 50000, lowStockAlert: 5000, isBase: true },
      { code: 'USD', name: 'US Dollar', symbol: '$', currentRate: 1.08, buyRate: 1.075, sellRate: 1.085, stockAmount: 40000, lowStockAlert: 5000 },
      { code: 'GBP', name: 'British Pound', symbol: '£', currentRate: 0.86, buyRate: 0.855, sellRate: 0.865, stockAmount: 20000, lowStockAlert: 2000 },
      { code: 'XOF', name: 'CFA Franc BCEAO (Afrique de l\'Ouest)', symbol: 'FCFA', currentRate: 655.96, buyRate: 653, sellRate: 658, stockAmount: 10000000, lowStockAlert: 500000 },
      { code: 'XAF', name: 'CFA Franc BEAC (Afrique Centrale)', symbol: 'FCFA', currentRate: 655.96, buyRate: 653, sellRate: 658, stockAmount: 10000000, lowStockAlert: 500000 },
      { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', currentRate: 1650, buyRate: 1640, sellRate: 1660, stockAmount: 5000000, lowStockAlert: 200000 },
      { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', currentRate: 10.8, buyRate: 10.75, sellRate: 10.85, stockAmount: 100000, lowStockAlert: 10000 },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', currentRate: 0.96, buyRate: 0.955, sellRate: 0.965, stockAmount: 15000, lowStockAlert: 2000 }
    ];

    for (const c of currencies) {
      const exists = await Currency.findOne({ where: { code: c.code } });
      if (!exists) {
        await Currency.create(c);
        console.log(`Currency ${c.code} created.`);
      }
    }

    const demoClients = [
      { name: 'Mahaman Kabir', phone: '+22790000001', idNumber: 'NE100001' },
      { name: 'Jean Yves', phone: '+22790000002', idNumber: 'NE100002' },
      { name: 'Issa Mahaman', phone: '+22790000003', idNumber: 'NE100003' }
    ];

    for (const c of demoClients) {
      const exists = await Client.findOne({ where: { phone: c.phone } });
      if (!exists) {
        await Client.create(c);
        console.log(`Client ${c.name} created.`);
      }
    }

    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
