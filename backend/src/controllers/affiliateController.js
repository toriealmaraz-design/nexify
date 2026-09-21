/**
 * Affiliate Controller
 * Handles link generation, tracking, dashboard stats, and swipe assets.
 *
 * Covers: Affiliate Network Layer (REQ-DIG-01, REQ-DIG-02)
 */

const { prisma } = require('../config/prisma');
const crypto = require('crypto');

const constants = require('../config/constants');

// ─── Generate unique affiliate code ────────────────────────
function generateAffiliateCode() {
  const prefix = 'AFF';
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}

// ─── GENERATE LINK ─────────────────────────────────────────
async function generateLink(req, res) {
  try {
    const { courseId, sourceTag } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'courseId is required.',
      });
    }

    // Verify course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, slug: true, affiliateRate: true, status: true },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Course not found.',
      });
    }

    if (course.status !== 'PUBLISHED') {
      return res.status(422).json({
        success: false,
        statusCode: 422,
        error: 'UNPROCESSABLE_ENTITY',
        message: 'Cannot generate affiliate link for a non-published course.',
      });
    }

    // Generate unique code
    let affiliateCode = generateAffiliateCode();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.affiliateLink.findUnique({
        where: { affiliateCode },
        select: { id: true },
      });
      if (!exists) break;
      affiliateCode = generateAffiliateCode();
      attempts++;
    }

    // Create affiliate link
    const link = await prisma.affiliateLink.create({
      data: {
        id: crypto.randomUUID(),
        affiliateId: req.user.userId,
        courseId: course.id,
        affiliateCode,
        sourceTag: sourceTag || null,
      },
    });

    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/course/${course.slug}?aff=${affiliateCode}`;

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Affiliate link generated.',
      data: {
        affiliateCode: link.affiliateCode,
        courseId: course.id,
        trackingUrl,
        affiliateRate: course.affiliateRate,
      },
    });

  } catch (error) {
    console.error('[GENERATE LINK ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to generate affiliate link.',
    });
  }
}

// ─── CLICK TRACKING (cookie setting endpoint) ──────────────
// Called when a user lands via ?aff=CODE — sets the 30-day cookie
async function trackClick(req, res) {
  try {
    const { aff } = req.query;

    if (!aff) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'aff parameter is required.',
      });
    }

    // Validate affiliate code exists
    const link = await prisma.affiliateLink.findUnique({
      where: { affiliateCode: aff },
      include: { course: { select: { slug: true, title: true } } },
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Affiliate code not found.',
      });
    }

    // Increment click count
    await prisma.affiliateLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    });

    // Set cookie + localStorage instructions via response
    // The frontend reads this and sets nexify_aff_code in localStorage + cookie
    const cookieValue = `${aff}; max-age=${2592000}; path=/; SameSite=Lax`;

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Affiliate click tracked.',
      data: {
        affiliateCode: aff,
        courseSlug: link.course.slug,
        courseTitle: link.course.title,
        cookieSet: true,
        expiresInSeconds: 2592000, // 30 days
      },
    }).setHeader('Set-Cookie', cookieValue);

  } catch (error) {
    console.error('[TRACK CLICK ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to track affiliate click.',
    });
  }
}

// ─── AFFILIATE DASHBOARD ───────────────────────────────────
async function getDashboard(req, res) {
  try {
    // Aggregate click counts across all links
    const links = await prisma.affiliateLink.findMany({
      where: { affiliateId: req.user.userId },
      include: {
        course: { select: { title: true, slug: true, affiliateRate: true } },
        orders: {
          where: { paymentStatus: 'SUCCESSFUL' },
          select: { totalAmountGhs: true, id: true },
        },
      },
    });

    const totalClicks = links.reduce((sum, l) => sum + l.clickCount, 0);
    const totalConversions = links.reduce((sum, l) => sum + l.orders.length, 0);
    const conversionRate = totalClicks > 0
      ? parseFloat(((totalConversions / totalClicks) * 100).toFixed(2))
      : 0;

    // Commission balances
    const commissions = await prisma.commission.findMany({
      where: { affiliateId: req.user.userId },
      select: { amountGhs: true, status: true },
    });

    const totalEarned = commissions.reduce((sum, c) => sum + c.amountGhs, 0);
    const clearedBalance = commissions
      .filter(c => c.status === 'CLEARED')
      .reduce((sum, c) => sum + c.amountGhs, 0);
    const pendingBalance = commissions
      .filter(c => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.amountGhs, 0);

    // Course breakdown
    const courseBreakdown = links.map(link => ({
      courseId: link.course.id,
      courseTitle: link.course.title,
      courseSlug: link.course.slug,
      affiliateRate: link.course.affiliateRate,
      clicks: link.clickCount,
      conversions: link.orders.length,
      revenue: link.orders.reduce((sum, o) => sum + o.totalAmountGhs, 0),
      trackingUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/course/${link.course.slug}?aff=${link.affiliateCode}`,
    }));

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Affiliate performance metrics retrieved.',
      data: {
        totalClicks,
        totalConversions,
        conversionRate,
        totalEarnedGhs: totalEarned,
        clearedBalanceGhs: clearedBalance,
        pendingBalanceGhs: pendingBalance,
        courseBreakdown,
      },
    });

  } catch (error) {
    console.error('[AFFILIATE DASHBOARD ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve affiliate dashboard.',
    });
  }
}

// ─── GET SWIPE ASSETS ──────────────────────────────────────
async function getSwipes(req, res) {
  try {
    const { courseId } = req.params;

    const swipes = await prisma.swipeAsset.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });

    if (swipes.length === 0) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'No swipe assets found for this course.',
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Course swipe assets retrieved.',
      data: swipes,
    });

  } catch (error) {
    console.error('[GET SWIPES ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve swipe assets.',
    });
  }
}

// ─── LIST AFFILIATE LINKS ───────────────────────────────────
async function listLinks(req, res) {
  try {
    const links = await prisma.affiliateLink.findMany({
      where: { affiliateId: req.user.userId },
      include: {
        course: { select: { title: true, slug: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Affiliate links retrieved.',
      data: links,
    });

  } catch (error) {
    console.error('[LIST LINKS ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve affiliate links.',
    });
  }
}

module.exports = {
  generateLink,
  trackClick,
  getDashboard,
  getSwipes,
  listLinks,
};
