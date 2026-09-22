/**
 * Coupon Controller
 * Handles coupon validation, creation, listing, update, and deactivation.
 */

const { prisma } = require('../config/prisma');

// ─── VALIDATE COUPON ─────────────────────────────────────────
// GET /api/v1/coupons/validate/:code
async function validateCoupon(req, res) {
  try {
    const { code } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Coupon not found.',
      });
    }

    if (!coupon.active) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'COUPON_INACTIVE',
        message: 'This coupon is no longer active.',
      });
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'COUPON_NOT_YET_VALID',
        message: 'This coupon is not yet valid.',
      });
    }

    if (coupon.expiresAt && now > coupon.expiresAt) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'COUPON_EXPIRED',
        message: 'This coupon has expired.',
      });
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'COUPON_LIMIT_REACHED',
        message: 'This coupon has reached its usage limit.',
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Coupon is valid.',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderGhs: coupon.minOrderGhs,
        expiresAt: coupon.expiresAt,
      },
    });
  } catch (error) {
    console.error('[VALIDATE COUPON ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to validate coupon.',
    });
  }
}

// ─── CREATE COUPON ────────────────────────────────────────────
// POST /api/v1/coupons
async function createCoupon(req, res) {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderGhs = 0,
      maxUses = 0,
      startsAt,
      expiresAt,
      active = true,
    } = req.body;

    if (!code || !discountType || !discountValue || !expiresAt) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'code, discountType, discountValue, and expiresAt are required.',
      });
    }

    if (!['PERCENTAGE', 'FIXED'].includes(discountType)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'discountType must be PERCENTAGE or FIXED.',
      });
    }

    if (discountType === 'PERCENTAGE' && (discountValue <= 0 || discountValue > 100)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Percentage discount must be between 0 and 100.',
      });
    }

    // Check uniqueness
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        statusCode: 409,
        error: 'CONFLICT',
        message: 'A coupon with this code already exists.',
      });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minOrderGhs,
        maxUses,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: new Date(expiresAt),
        active,
      },
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Coupon created.',
      data: coupon,
    });
  } catch (error) {
    console.error('[CREATE COUPON ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create coupon.',
    });
  }
}

// ─── LIST ALL COUPONS ─────────────────────────────────────────
// GET /api/v1/coupons
async function listCoupons(req, res) {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Coupons retrieved.',
      data: coupons,
    });
  } catch (error) {
    console.error('[LIST COUPONS ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve coupons.',
    });
  }
}

// ─── UPDATE COUPON ────────────────────────────────────────────
// PUT /api/v1/coupons/:id
async function updateCoupon(req, res) {
  try {
    const { id } = req.params;
    const {
      code,
      discountType,
      discountValue,
      minOrderGhs,
      maxUses,
      startsAt,
      expiresAt,
      active,
    } = req.body;

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Coupon not found.',
      });
    }

    if (discountType && !['PERCENTAGE', 'FIXED'].includes(discountType)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'discountType must be PERCENTAGE or FIXED.',
      });
    }

    if (discountType === 'PERCENTAGE' && discountValue && (discountValue <= 0 || discountValue > 100)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Percentage discount must be between 0 and 100.',
      });
    }

    // If changing code, check uniqueness
    if (code && code.toUpperCase() !== existing.code) {
      const duplicate = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          statusCode: 409,
          error: 'CONFLICT',
          message: 'A coupon with this code already exists.',
        });
      }
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(discountType && { discountType }),
        ...(discountValue !== undefined && { discountValue }),
        ...(minOrderGhs !== undefined && { minOrderGhs }),
        ...(maxUses !== undefined && { maxUses }),
        ...(startsAt && { startsAt: new Date(startsAt) }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
        ...(active !== undefined && { active }),
      },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Coupon updated.',
      data: updated,
    });
  } catch (error) {
    console.error('[UPDATE COUPON ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update coupon.',
    });
  }
}

// ─── DEACTIVATE COUPON ───────────────────────────────────────
// DELETE /api/v1/coupons/:id
async function deactivateCoupon(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Coupon not found.',
      });
    }

    await prisma.coupon.update({
      where: { id },
      data: { active: false },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Coupon deactivated.',
    });
  } catch (error) {
    console.error('[DEACTIVATE COUPON ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to deactivate coupon.',
    });
  }
}

module.exports = {
  validateCoupon,
  createCoupon,
  listCoupons,
  updateCoupon,
  deactivateCoupon,
};
