const express = require('express');
const morgan = require('morgan');
const config = require('./config');
const { configureCors, configureHelmet } = require('./middleware/security');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/apps');
const licenseRoutes = require('./routes/licenses');
const clientRoutes = require('./routes/client');
const dashboardRoutes = require('./routes/dashboard');
const logRoutes = require('./routes/logs');
const v2Routes = require('./routes/v2');
const featureRoutes = require('./routes/features');

const app = express();

// ===== MIDDLEWARE =====
app.use(configureHelmet());
app.use(configureCors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(generalLimiter);

// Trust proxy for correct IP detection behind reverse proxies
app.set('trust proxy', 1);

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/v2', v2Routes); // KeyAuth / Authly compatible protocol
app.use('/api', featureRoutes); // Cloud variables, Blacklist, Webhooks, App Users

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ===== START SERVER =====
if (!process.env.VERCEL) {
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════╗
║          DARK-AUTH Backend Server             ║
║   Running on http://0.0.0.0:${config.port}            ║
║   Environment: ${config.nodeEnv.padEnd(28)}║
╚══════════════════════════════════════════════╝
    `);
  });
}

module.exports = app;
