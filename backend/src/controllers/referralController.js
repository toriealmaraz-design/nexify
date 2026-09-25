/**
 * Referral Controller
 * Handles referral stats, leaderboard, and recording new referrals.
 */

const { prisma } = require('../config/prisma');

// ─── GET REFERRAL STATS ───────────────────────────────────────
// GET /api/v1/affiliates/referral-stats
async function getReferralStats(req, res) {
  try {
    const affiliateId = req.user.userId;

    const referrals = await prisma.referral.findMany({
      where: { affiliateId },
    });

    const totalConversions = referrals.reduce((sum, r) => sum + r.conversions, 0);
    const totalEarnings = referrals.reduce((sum, r) => sum + r.earningsGhs, 0);

    // Breakdown by course
    const byCourse = await prisma.referral.groupBy({
      by: ['courseId'],
      where: { affiliateId },
      _sum: { conversions: true, earningsGhs: true },
    });

    const courseBreakdown = await Promise.all(
      byCourse.map(async (group) => {
        const course = await prisma.course.findUnique({
          where: { id: group.courseId },
          select: { id: true, title: true, slug: true },
        });
        return {
          courseId: group.courseId,
          courseTitle: course?.title || 'Unknown',
          courseSlug: course?.slug || '',
          conversions: group._sum.conversions || 0,
          earningsGhs: group._sum.earningsGhs || 0,
        };
      })
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Referral stats retrieved.',
      data: {
        totalConversions,
        totalEarningsGhs: totalEarnings,
        courseBreakdown,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve referral stats.',
    });
  }
}

// ─── GET LEADERBOARD ─────────────────────────────────────────
// GET /api/v1/affiliates/leaderboard
async function getLeaderboard(req, res) {
  try {
    const topAffiliates = await prisma.referral.groupBy({
      by: ['affiliateId'],
      _sum: { conversions: true, earningsGhs: true },
      orderBy: { _sum: { conversions: 'desc' } },
      take: 10,
    });

    const enriched = await Promise.all(
      topAffiliates.map(async (entry, index) => {
        const user = await prisma.user.findUnique({
          where: { id: entry.affiliateId },
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        });
        return {
          rank: index + 1,
          affiliateId: entry.affiliateId,
          affiliateName: user?.fullName || 'Unknown',
          affiliateEmail: user?.email || '',
          avatarUrl: user?.avatarUrl || null,
          conversions: entry._sum.conversions || 0,
          earningsGhs: entry._sum.earningsGhs || 0,
        };
      })
    );

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Leaderboard retrieved.',
      data: enriched,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve leaderboard.',
    });
  }
}

// ─── RECORD REFERRAL ──────────────────────────────────────────
// POST /api/v1/affiliates/referral
async function recordReferral(req, res) {
  try {
    const { refereeId, courseId } = req.body;
    const affiliateId = req.user.userId;

    if (!refereeId || !courseId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'refereeId and courseId are required.',
      });
    }

    // Verify the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, priceGhs: true, affiliateRate: true },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Course not found.',
      });
    }

    // Check if referral already recorded for this affiliate+referee+course combo
    const existing = await prisma.referral.findFirst({
      where: { affiliateId, refereeId, courseId },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        statusCode: 409,
        error: 'REFERRAL_EXISTS',
        message: 'This referral has already been recorded.',
      });
    }

    // Calculate earnings based on course price and affiliate rate
    const earnings = Math.round((course.priceGhs * course.affiliateRate) * 100) / 100;

    const referral = await prisma.referral.create({
      data: {
        affiliateId,
        refereeId,
        courseId,
        conversions: 1,
        earningsGhs: earnings,
      },
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Referral recorded.',
      data: referral,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to record referral.',
    });
  }
}

module.exports = {
  getReferralStats,
  getLeaderboard,
  recordReferral,
};
