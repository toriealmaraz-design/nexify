/**
 * Payout Controller
 * Handles payout requests, balance queries, and admin payout management.
 */

const { prisma } = require('../config/prisma');
const constants = require('../config/constants');

// ─── GET USER PAYOUT HISTORY ─────────────────────────────────
// GET /api/v1/payouts
async function getPayoutHistory(req, res) {
  try {
    const payouts = await prisma.payout.findMany({
      where: { userId: req.user.userId },
      orderBy: { requestedAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Payout history retrieved.',
      data: payouts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve payout history.',
    });
  }
}

// ─── REQUEST PAYOUT ──────────────────────────────────────────
// POST /api/v1/payouts/request
async function requestPayout(req, res) {
  try {
    const { amountGhs, method = 'MOBILE_MONEY', notes } = req.body;

    if (!amountGhs || amountGhs <= 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'amountGhs must be a positive number.',
      });
    }

    if (amountGhs < constants.MIN_PAYOUT_THRESHOLD_GHS) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BELOW_MINIMUM',
        message: `Minimum payout is GH₵ ${constants.MIN_PAYOUT_THRESHOLD_GHS}.`,
      });
    }

    if (!['MOBILE_MONEY', 'BANK_TRANSFER'].includes(method)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'method must be MOBILE_MONEY or BANK_TRANSFER.',
      });
    }

    // Compute cleared balance
    const commissions = await prisma.commission.findMany({
      where: {
        affiliateId: req.user.userId,
        status: 'CLEARED',
      },
      select: { amountGhs: true },
    });

    const totalEarned = commissions.reduce((sum, c) => sum + c.amountGhs, 0);

    // Subtract already-paid-out amounts (COMPLETED payouts)
    const paidOut = await prisma.payout.findMany({
      where: {
        userId: req.user.userId,
        status: 'COMPLETED',
      },
      select: { amountGhs: true },
    });

    const totalPaidOut = paidOut.reduce((sum, p) => sum + p.amountGhs, 0);
    const availableBalance = Math.round((totalEarned - totalPaidOut) * 100) / 100;

    if (amountGhs > availableBalance) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'INSUFFICIENT_BALANCE',
        message: `Requested GH₵ ${amountGhs} but available balance is GH₵ ${availableBalance}.`,
        data: { availableBalance },
      });
    }

    // Check for a pending/processing payout
    const existingPending = await prisma.payout.findFirst({
      where: {
        userId: req.user.userId,
        status: { in: ['PROCESSING', 'PENDING'] },
      },
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        statusCode: 409,
        error: 'PAYOUT_IN_PROGRESS',
        message: 'A payout is already being processed. Please wait for it to complete.',
      });
    }

    const payout = await prisma.payout.create({
      data: {
        userId: req.user.userId,
        amountGhs,
        method,
        notes: notes || null,
        status: 'PROCESSING',
      },
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Payout requested successfully.',
      data: payout,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to request payout.',
    });
  }
}

// ─── GET AVAILABLE BALANCE ────────────────────────────────────
// GET /api/v1/payouts/balance
async function getBalance(req, res) {
  try {
    const commissions = await prisma.commission.findMany({
      where: {
        affiliateId: req.user.userId,
        status: 'CLEARED',
      },
      select: { amountGhs: true },
    });

    const totalEarned = commissions.reduce((sum, c) => sum + c.amountGhs, 0);

    const paidOut = await prisma.payout.findMany({
      where: {
        userId: req.user.userId,
        status: 'COMPLETED',
      },
      select: { amountGhs: true },
    });

    const totalPaidOut = paidOut.reduce((sum, p) => sum + p.amountGhs, 0);
    const availableBalance = Math.round((totalEarned - totalPaidOut) * 100) / 100;

    const pendingPayout = await prisma.payout.findFirst({
      where: {
        userId: req.user.userId,
        status: { in: ['PROCESSING', 'PENDING'] },
      },
      select: { amountGhs: true },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Balance retrieved.',
      data: {
        totalEarnedGhs: totalEarned,
        totalPaidOutGhs: totalPaidOut,
        availableBalanceGhs: availableBalance,
        pendingPayoutGhs: pendingPayout ? pendingPayout.amountGhs : 0,
        minPayoutThresholdGhs: constants.MIN_PAYOUT_THRESHOLD_GHS,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve balance.',
    });
  }
}

// ─── ADMIN: LIST ALL PAYOUTS ──────────────────────────────────
// GET /api/v1/payouts/admin
async function listAllPayouts(req, res) {
  try {
    const { status, userId, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { requestedAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.payout.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Payouts retrieved.',
      data: {
        payouts,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve payouts.',
    });
  }
}

// ─── ADMIN: UPDATE PAYOUT STATUS ──────────────────────────────
// PUT /api/v1/payouts/:id/status
async function updatePayoutStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reference, notes } = req.body;

    if (!['PROCESSING', 'COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'status must be PROCESSING, COMPLETED, or FAILED.',
      });
    }

    const existing = await prisma.payout.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Payout not found.',
      });
    }

    const updated = await prisma.payout.update({
      where: { id },
      data: {
        status,
        ...(reference && { reference }),
        ...(notes && { notes }),
        ...(status === 'COMPLETED' && { processedAt: new Date() }),
      },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Payout status updated.',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update payout status.',
    });
  }
}

module.exports = {
  getPayoutHistory,
  requestPayout,
  getBalance,
  listAllPayouts,
  updatePayoutStatus,
};
