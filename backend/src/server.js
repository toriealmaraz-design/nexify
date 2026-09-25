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
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const csrf = require('csurf');
const config = require('./config/env');
const constants = require('./config/constants');

// ─── Prisma Client ────────────────────────────────────────
const prisma = new PrismaClient();

// ─── Express App ──────────────────────────────────────────
const app = express();

// ─── Middleware Stack ──────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
}));

// ─── Rate Limiting ─────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1/', apiLimiter);

// Stricter limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1/auth/', authLimiter);

// ─── Security Headers ──────────────────────────────
app.use(helmet());

// ─── CSRF Protection ──────────────────────────────
const csrfProtection = csrf({ cookie: true });
app.get('/api/v1/csrf-token', csrfProtection, (req, res) => {
  res.json({ success: true, csrfToken: req.csrfToken() });
});

// Apply CSRF to all state-changing routes
app.use('/api/v1/', csrfProtection);

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
app.use('/api/v1/nexa-config', require('./routes/nexaConfigRoutes'));
app.use('/api/v1/nexa-global-config', require('./routes/nexaGlobalConfigRoutes'));
app.use('/api/v1/chatbot-replies', require('./routes/chatbotReplyRoutes'));
app.use('/api/v1/advertisements', require('./routes/advertisementRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/creators', require('./routes/creatorRoutes'));
app.use('/api/v1/enrollments', require('./routes/progressRoutes'));
app.use('/api/v1/waitlist', require('./routes/waitlistRoutes'));
app.use('/api/v1/coupons', require('./routes/couponRoutes'));
app.use('/api/v1/payouts', require('./routes/payoutRoutes'));
app.use('/api/v1/referrals', require('./routes/referralRoutes'));
app.use('/api/v1/certificates', require('./routes/certificateRoutes'));
app.use('/api/v1/questions', require('./routes/questionRoutes'));
app.use('/api/v1/announcements', require('./routes/announcementRoutes'));
app.use('/api/v1/nexa-chat', require('./routes/nexaChatRoutes'));
app.use('/api/v1/community', require('./routes/communityRoutes'));
app.use('/api/v1/gamification', require('./routes/gamificationRoutes'));
app.use('/api/v1/notes', require('./routes/noteRoutes'));
app.use('/api/v1/bookmarks', require('./routes/bookmarkRoutes'));

// ─── 404 Handler ────────────────────────────────────────────
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
const server = app.listen(config.port, '127.0.0.1', () => {
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
