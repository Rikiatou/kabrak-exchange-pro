require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

console.log('🚀 Starting KABRAK Exchange Pro Backend...');
console.log('📊 Environment:', process.env.NODE_ENV);
console.log('🔌 Port:', process.env.PORT || 5000);
console.log('🗄️ Database URL exists:', !!process.env.DATABASE_URL);

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
const teamRoutes = require('./routes/team.routes');
const receiptRoutes = require('./routes/receipt.routes');
const notificationRoutes = require('./routes/notification.routes');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// Serve admin static files BEFORE helmet so no CSP restriction applies
app.use('/admin-dashboard.html', express.static(path.join(__dirname, '../public')));
app.use('/admin-dashboard.js', express.static(path.join(__dirname, '../public')));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://kabrak-exchange-pro-production.up.railway.app"],
    },
  },
}));
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

// Stripe webhook needs raw body for signature verification - MUST be before express.json()
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));

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
app.use('/api/team', teamRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/admin', express.static(path.join(__dirname, '../public')));
app.use('/admin-pro', express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public')));

// Account deletion request (for Google Play / App Store compliance)
app.post('/api/account/delete-request', async (req, res) => {
  try {
    const { email, name, reason } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email requis.' });
    console.log(`🗑️ Account deletion request received: ${email} (${name || 'N/A'}) - Reason: ${reason || 'none'}`);
    // Send notification email to admin
    const { sendEmail } = require('./services/email.service');
    if (sendEmail) {
      await sendEmail({
        to: 'kabrakeng@gmail.com',
        subject: `🗑️ Demande de suppression de compte — ${email}`,
        html: `
          <div style="font-family:Arial,sans-serif;padding:20px;">
            <h2>Demande de suppression de compte</h2>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Nom :</strong> ${name || 'Non fourni'}</p>
            <p><strong>Raison :</strong> ${reason || 'Non fournie'}</p>
            <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
            <hr>
            <p style="color:#888;">Veuillez traiter cette demande dans un délai de 30 jours.</p>
          </div>
        `
      });
    }
    res.json({ success: true, message: 'Demande de suppression enregistrée.' });
  } catch (e) {
    console.error('Delete request error:', e.message);
    res.json({ success: true, message: 'Demande de suppression enregistrée.' });
  }
});

// Homepage redirect to payment
app.get('/', (req, res) => {
  res.redirect('/payment.html');
});

// Admin dashboard routes
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin-dashboard.html')));
app.get('/admin/', (req, res) => res.sendFile(path.join(__dirname, '../public/admin-dashboard.html')));
app.get('/admin-dashboard.html', (req, res) => res.sendFile(path.join(__dirname, '../public/admin-dashboard.html')));
app.get('/admin-dashboard.html/', (req, res) => res.sendFile(path.join(__dirname, '../public/admin-dashboard.html')));
app.get('/admin-dashboard.js', (req, res) => res.sendFile(path.join(__dirname, '../public/admin-dashboard.js')));

// Simple healthcheck without database dependency
app.get('/api/health-simple', (req, res) => {
  console.log('🏥 Simple healthcheck requested at:', new Date().toISOString());
  
  const response = { 
    success: true, 
    message: 'Exchange Management API is running (simple check)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
  
  console.log('🟢 Simple healthcheck passed:', response);
  res.json(response);
});

// Full healthcheck with database
app.get('/api/health', async (req, res) => {
  console.log('🏥 Full healthcheck requested at:', new Date().toISOString());
  
  try {
    console.log('🔍 Testing database connection...');
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    const response = { 
      success: true, 
      message: 'Exchange Management API is running',
      version: '1.0.0',
      database: 'connected',
      timestamp: new Date().toISOString()
    };
    
    console.log('🟢 Full healthcheck passed:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔥 Full database error:', error);
    
    const response = { 
      success: false, 
      message: 'Database not connected',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔴 Full healthcheck failed:', response);
    res.status(503).json(response);
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

const runMigrations = async () => {
  const queries = [
    // Ensure users.name column exists
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT 'Utilisateur'`,
    // Ensure users.expoPushToken column exists
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "expoPushToken" VARCHAR(255)`,
    // Ensure settings table exists (INTEGER id to match Sequelize model)
    `CREATE TABLE IF NOT EXISTS settings (id SERIAL PRIMARY KEY, key VARCHAR(100) NOT NULL UNIQUE, value TEXT)`,
    // Remove problematic unique+default constraints on reference columns if they exist
    `ALTER TABLE transactions ALTER COLUMN reference SET DEFAULT ''`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "paymentMethod" VARCHAR(100)`,
    `ALTER TABLE deposit_orders ALTER COLUMN reference SET DEFAULT ''`,
    `ALTER TABLE deposits ALTER COLUMN code SET DEFAULT ''`,
  ];
  for (const q of queries) {
    try {
      await sequelize.query(q);
    } catch (e) {
      console.warn(`⚠️ Migration warning (non-fatal): ${e.message}`);
    }
  }
  console.log('✅ Column migrations done.');
};

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
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🔗 Healthcheck available at: http://localhost:${PORT}/api/health`);
});

console.log('🗄️ Starting database connection...');
sequelize.authenticate()
  .then(async () => {
    console.log('✅ Database connected successfully.');
    console.log('🔄 Running column migrations BEFORE sync...');
    await runMigrations();
    console.log('🔄 Syncing database models...');
    return sequelize.sync({ alter: true });
  })
  .then(async () => {
    console.log('🔄 Running client code migration...');
    await migrateClientCodes();
    console.log('✅ Database synced successfully.');
    console.log('🚀 KABRAK Exchange Pro Backend is ready!');

    // ── Daily rate sync cron (every 24h, first run after 2 min) ──
    const { syncMarketRates } = require('./controllers/currency.controller');
    const runDailySync = async () => {
      console.log('⏰ Daily rate sync starting...');
      try { await syncMarketRates('daily-cron'); } catch (e) { console.error('Daily sync error:', e.message); }
    };
    setTimeout(() => {
      runDailySync();
      setInterval(runDailySync, 24 * 60 * 60 * 1000);
    }, 2 * 60 * 1000);
    console.log('⏰ Daily rate sync scheduled (first run in 2 min)');
  })
  .catch(err => {
    console.error('❌ Unable to connect to database:', err);
    console.error('🔥 Full database error:', err);
  });

module.exports = app;
