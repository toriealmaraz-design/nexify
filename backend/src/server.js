/**
 * Nexify Backend — Main Express Server Entry Point
 *
 * Bootstrap sequence:
 * 1. Load env config
 * 2. Initialize Prisma client
 * 3. Create Express app with middleware stack
 * 4. Mount API routes
 * 5. Start listening
 */

const { PrismaClient } = require('@prisma/client');
const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const constants = require('./config/constants');

// ─── Prisma Client ────────────────────────────────────────
const prisma = new PrismaClient();

// ─── Express App ──────────────────────────────────────────
const app = express();

// ─── Middleware Stack ──────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static Asset Serving ─────────────────────────────────
// Serves branding assets at /assets/branding/
app.use('/assets', express.static(
  `${__dirname}/../../frontend/public/assets`,
  { maxAge: '1h', immutable: true }
));

// ─── Health Check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────
// All routes mounted under /api/v1 prefix
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/courses', require('./routes/courseRoutes'));
app.use('/api/v1/orders', require('./routes/orderRoutes'));
app.use('/api/v1/affiliates', require('./routes/affiliateRoutes'));
app.use('/api/v1/nexa', require('./routes/nexaRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));

// ─── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found.`,
  });
});

// ─── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    statusCode: err.statusCode || 500,
    error: err.error || 'INTERNAL_SERVER_ERROR',
    message: config.nodeEnv === 'production'
      ? 'An unexpected error occurred.'
      : err.message,
    details: config.nodeEnv === 'development' ? [err.stack] : [],
  });
});

// ─── Server Startup ───────────────────────────────────────
const server = app.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║                                            ║
║   NEXIFY PLATFORM BACKEND                  ║
║   Running on http://localhost:${config.port}            ║
║   Environment: ${config.nodeEnv.padEnd(18)}║
║   Database: SQLite (dev.db)                ║
║                                            ║
╚══════════════════════════════════════════════╝
  `);
});

// ─── Graceful Shutdown ────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n[SHUTDOWN] Received ${signal}. Closing...`);
  server.close(() => {
    prisma.$disconnect().then(() => {
      console.log('[SHUTDOWN] Prisma disconnected. Goodbye.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Export for Testing ───────────────────────────────────
module.exports = { app, prisma, config, constants };
