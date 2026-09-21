/**
 * NEXA SCOPE MIDDLEWARE
 * Role-Scoped Intelligence Controller Guard
 *
 * Every request to /api/v1/nexa/chat passes through this middleware.
 * It extracts the user's role from the JWT, pre-fetches only the
 * database records the user is authorized to see, and attaches the
 * scoped context to the request for the controller.
 *
 * Reference: 07_NEXA.md Section 4, 02_PRD.md Section 4
 */

const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('./auth');

const prisma = new PrismaClient();

/**
 * Nexa scoping middleware pipeline:
 * 1. Authenticate the request (JWT verification)
 * 2. Extract role and user ID
 * 3. Pre-fetch scoped database records
 * 4. Attach context to req.nexaScopedContext
 */
async function nexaScopeMiddleware(req, res, next) {
  try {
    // Step 1: Authenticate
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Authentication token required to access Nexa.',
      });
    }

    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, require('../config/env').jwt.secret);

    req.user = decoded; // { userId, email, role }

    // Step 2 & 3: Pre-fetch scoped data based on role
    let scopedContextData = {};

    switch (decoded.role) {
      case 'STUDENT':
        scopedContextData = await prisma.order.findMany({
          where: { studentId: decoded.userId, paymentStatus: 'SUCCESSFUL' },
          include: {
            course: {
              include: {
                modules: { include: { lessons: true } },
                reviews: true,
              },
            },
            enrollment: true,
          },
        });
        break;

      case 'AFFILIATE':
        scopedContextData = await prisma.affiliateLink.findMany({
          where: { affiliateId: decoded.userId },
          include: {
            course: { select: { title: true, priceGhs: true, affiliateRate: true, type: true } },
            orders: { where: { paymentStatus: 'SUCCESSFUL' } },
          },
        });
        // Add commission summary
        const commissions = await prisma.commission.findMany({
          where: { affiliateId: decoded.userId },
          select: { amountGhs: true, status: true },
        });
        scopedContextData.commissionSummary = commissions;
        break;

      case 'CREATOR':
        scopedContextData = await prisma.course.findMany({
          where: { creatorId: decoded.userId },
          include: {
            orders: { where: { paymentStatus: 'SUCCESSFUL' } },
            modules: { include: { lessons: true } },
            swipeAssets: true,
            reviews: true,
          },
        });
        break;

      case 'ADMIN':
        // Full read access — global data
        const pendingQueue = await prisma.course.findMany({
          where: { status: 'PENDING_APPROVAL' },
          include: {
            creator: { select: { fullName: true, email: true } },
            modules: { include: { lessons: true } },
          },
        });
        const totalOrders = await prisma.order.aggregate({
          where: { paymentStatus: 'SUCCESSFUL' },
          _sum: { totalAmountGhs: true, platformFeeGhs: true, creatorShareGhs: true, affiliateShareGhs: true },
          _count: { id: true },
        });
        const userStats = await prisma.user.groupBy({
          by: ['role'],
          _count: { id: true },
        });
        scopedContextData = {
          pendingQueue,
          globalFinancials: totalOrders._sum,
          orderCount: totalOrders._count.id,
          userStats,
        };
        break;

      default:
        return res.status(403).json({
          success: false,
          statusCode: 403,
          error: 'FORBIDDEN',
          message: 'Invalid user role for Nexa invocation.',
        });
    }

    // Step 4: Attach scoped context
    req.nexaScopedContext = scopedContextData;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      error: 'INVALID_TOKEN',
      message: 'Failed to authenticate Nexa request session.',
      details: error.message,
    });
  }
}

module.exports = { nexaScopeMiddleware };
