require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { sequelize } = require('./database/connection');
const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const transactionRoutes = require('./routes/transaction.routes');
const paymentRoutes = require('./routes/payment.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const currencyRoutes = require('./routes/currency.routes');
const cashbookRoutes = require('./routes/cashbook.routes');
const reportRoutes = require('./routes/report.routes');
const userRoutes = require('./routes/user.routes');
const alertRoutes = require('./routes/alert.routes');
const auditRoutes = require('./routes/audit.routes');
const licenseRoutes = require('./routes/license.routes');
const adminRoutes = require('./routes/admin.routes');
const depositRoutes = require('./routes/deposit.routes');
const depositOrderRoutes = require('./routes/depositOrder.routes');
const clientPortalRoutes = require('./routes/clientPortal.routes');
const settingRoutes = require('./routes/setting.routes');
const exportRoutes = require('./routes/export.routes');
const exchangeRatesRoutes = require('./routes/exchangeRates.routes');
const cashCloseRoutes = require('./routes/cashClose.routes');
const searchRoutes = require('./routes/search.routes');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:8090', 'http://localhost:19006', 'https://exchange.kabrakeng.com'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(o => origin === o) ||
      /^https:\/\/kabrak-exchange-website(-[a-z0-9]+-rikiatous-projects)?\.vercel\.app$/.test(origin);
    callback(null, isAllowed);
  },
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' }
});
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Upload limit reached, please try again later.' }
});
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/public/client', uploadLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/cashbook', cashbookRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/deposit-orders', depositOrderRoutes);
app.use('/api/public/client', clientPortalRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/exchange-rates', exchangeRatesRoutes);
app.use('/api/cash-close', cashCloseRoutes);
app.use('/api/search', searchRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/admin', express.static(path.join(__dirname, '../public')));

app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    res.json({ 
      success: true, 
      message: 'Exchange Management API is running',
      version: '1.0.0',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      success: false, 
      message: 'Database not connected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const migrateClientCodes = async () => {
  const { Client } = require('./models');
  const { Op } = require('sequelize');
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const genCode = () => {
    const l1 = letters[Math.floor(Math.random() * letters.length)];
    const l2 = letters[Math.floor(Math.random() * letters.length)];
    return `${l1}${l2}${Math.floor(1000 + Math.random() * 9000)}`;
  };
  const clients = await Client.findAll({ where: { clientCode: { [Op.is]: null } } });
  for (const c of clients) {
    let code, exists;
    do { code = genCode(); exists = await Client.findOne({ where: { clientCode: code } }); } while (exists);
    await c.update({ clientCode: code });
  }
  if (clients.length > 0) console.log(`Generated clientCode for ${clients.length} existing clients.`);
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully.');
    return sequelize.sync({ alter: true });
  })
  .then(async () => {
    await migrateClientCodes();
    console.log('Database synced successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to database:', err);
  });

module.exports = app;
