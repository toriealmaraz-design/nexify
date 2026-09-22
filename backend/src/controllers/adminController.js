/**
 * Admin Controller
 * Handles staging queue, global metrics, user management, and asset management.
 *
 * Covers: Admin Moderation & Asset Management (SRS Section 5)
 */

const { prisma } = require('../config/prisma');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const constants = require('../config/constants');

// ─── STAGING QUEUE ─────────────────────────────────────────
async function getStagingQueue(req, res) {
  try {
    const courses = await prisma.course.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        creator: { select: { fullName: true, email: true } },
        modules: {
          include: { lessons: true },
          orderBy: { orderIndex: 'asc' },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Staging queue retrieved.',
      data: courses,
    });

  } catch (error) {
    console.error('[STAGING QUEUE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve staging queue.',
    });
  }
}

// ─── APPROVE / REJECT COURSE ───────────────────────────────
async function updateCourseStatus(req, res) {
  try {
    const { courseId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['PUBLISHED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'status must be PUBLISHED or REJECTED.',
      });
    }

    if (status === 'REJECTED' && !rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'rejectionReason is required when rejecting a course.',
      });
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
      include: {
        creator: { select: { fullName: true, email: true } },
      },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Course status updated to ${status}.`,
      data: {
        id: course.id,
        title: course.title,
        status: course.status,
        rejectionReason: course.rejectionReason,
      },
    });

  } catch (error) {
    console.error('[UPDATE COURSE STATUS ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update course status.',
    });
  }
}

// ─── GLOBAL METRICS ────────────────────────────────────────
async function getGlobalMetrics(req, res) {
  try {
    const [
      totalCourses,
      publishedCourses,
      totalUsers,
      totalOrders,
      totalRevenue,
      totalPlatformFees,
      totalCreatorEarnings,
      totalAffiliateEarnings,
      recentOrders,
    ] = await Promise.all([
      prisma.course.count(),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.user.count(),
      prisma.order.count({ where: { paymentStatus: 'SUCCESSFUL' } }),
      prisma.order.aggregate({
        where: { paymentStatus: 'SUCCESSFUL' },
        _sum: { totalAmountGhs: true },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: 'SUCCESSFUL' },
        _sum: { platformFeeGhs: true },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: 'SUCCESSFUL' },
        _sum: { creatorShareGhs: true },
      }),
      prisma.commission.aggregate({
        where: { status: 'CLEARED' },
        _sum: { amountGhs: true },
      }),
      prisma.order.findMany({
        where: { paymentStatus: 'SUCCESSFUL' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          course: { select: { title: true, slug: true } },
          student: { select: { fullName: true, email: true } },
          affiliateLink: { select: { affiliateCode: true } },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Global platform metrics retrieved.',
      data: {
        courses: {
          total: totalCourses,
          published: publishedCourses,
          pendingApproval: (await prisma.course.count({ where: { status: 'PENDING_APPROVAL' } })),
          rejected: (await prisma.course.count({ where: { status: 'REJECTED' } })),
        },
        users: {
          total: totalUsers,
          byRole: await prisma.user.groupBy({
            by: ['role'],
            _count: { id: true },
          }),
        },
        financials: {
          totalOrders,
          totalRevenueGhs: totalRevenue._sum.totalAmountGhs || 0,
          totalPlatformFeesGhs: totalPlatformFees._sum.platformFeeGhs || 0,
          totalCreatorEarningsGhs: totalCreatorEarnings._sum.creatorShareGhs || 0,
          totalAffiliateEarningsGhs: totalAffiliateEarnings._sum.amountGhs || 0,
          platformMarginPercent: totalRevenue._sum.totalAmountGhs > 0
            ? parseFloat((((totalPlatformFees._sum.platformFeeGhs || 0) / (totalRevenue._sum.totalAmountGhs || 1)) * 100).toFixed(2))
            : 0,
        },
        recentOrders,
      },
    });

  } catch (error) {
    console.error('getGlobalMetrics error:', error);
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error' });
  }
}

// ─── AFFILIATE LEADERBOARD ───────────────────────────────────────
async function getAffiliateLeaderboard(req, res) {
  try {
    const affiliates = await prisma.user.findMany({
      where: { role: 'AFFILIATE' },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        _count: { select: { affiliateLinks: { where: { clickCount: { gt: 0 } } } } },
        affiliateLinks: {
          select: {
            clickCount: true,
            orders: { where: { paymentStatus: 'SUCCESSFUL' } },
          },
        },
        commissions: {
          where: { status: 'CLEARED' },
          select: { amountGhs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const enriched = affiliates
      .map(a => {
        const totalClicks = a.affiliateLinks.reduce((sum, l) => sum + (l.clickCount || 0), 0);
        const totalConversions = a.affiliateLinks.reduce((sum, l) => sum + (l.orders?.length || 0), 0);
        const totalEarnedGhs = a.commissions.reduce((sum, c) => sum + parseFloat(c.amountGhs || 0), 0);
        return {
          id: a.id,
          fullName: a.fullName,
          email: a.email,
          totalClicks,
          totalConversions,
          totalEarnedGhs,
        };
      })
      .sort((a, b) => b.totalEarnedGhs - a.totalEarnedGhs);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Affiliate leaderboard retrieved.',
      data: enriched,
    });
  } catch (error) {
    console.error('getAffiliateLeaderboard error:', error);
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error' });
  }
}

// ─── USER MANAGEMENT GRID ──────────────────────────────────
async function getUserGrid(req, res) {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = role && role !== 'all' ? { role } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          phone: true,
          createdAt: true,
          _count: { select: { createdCourses: true, studentOrders: true, affiliateLinks: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User grid retrieved.',
      meta: {
        totalItems: total,
        itemCount: users.length,
        itemsPerPage: limitNum,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
      },
      data: users,
    });

  } catch (error) {
    console.error('[USER GRID ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve user grid.',
    });
  }
}

// ─── UPDATE USER ROLE ──────────────────────────────────────
async function updateUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['ADMIN', 'CREATOR', 'AFFILIATE', 'STUDENT'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: `role must be one of: ${validRoles.join(', ')}.`,
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User role updated.',
      data: user,
    });

  } catch (error) {
    console.error('[UPDATE USER ROLE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update user role.',
    });
  }
}

// ─── SYSTEM ASSETS ─────────────────────────────────────────
async function getSystemAssets(req, res) {
  try {
    const assets = await prisma.systemAsset.findMany({
      orderBy: { key: 'asc' },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'System assets retrieved.',
      data: assets,
    });

  } catch (error) {
    console.error('[GET SYSTEM ASSETS ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve system assets.',
    });
  }
}

// ─── UPDATE SYSTEM ASSET ───────────────────────────────────
async function updateSystemAsset(req, res) {
  try {
    const { key, fileUrl, mimeType } = req.body;

    if (!key || !fileUrl) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'key and fileUrl are required.',
      });
    }

    const asset = await prisma.systemAsset.upsert({
      where: { key },
      update: { fileUrl, mimeType },
      create: {
        id: crypto.randomUUID(),
        key,
        fileUrl,
        mimeType,
      },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'System asset updated.',
      data: asset,
    });

  } catch (error) {
    console.error('[UPDATE SYSTEM ASSET ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update system asset.',
    });
  }
}

// ─── CREATE SWIPE ASSET (Creator uploads promo materials) ──
async function createSwipeAsset(req, res) {
  try {
    const { courseId } = req.params;
    const { title, assetType, contentText, fileUrl } = req.body;

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { creatorId: true },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Course not found.',
      });
    }

    if (course.creatorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'FORBIDDEN',
        message: 'You can only add swipe assets to your own courses.',
      });
    }

    const swipe = await prisma.swipeAsset.create({
      data: {
        id: crypto.randomUUID(),
        courseId,
        title,
        assetType: assetType || 'WHATSAPP_SCRIPT',
        contentText: contentText || null,
        fileUrl: fileUrl || null,
      },
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Swipe asset created.',
      data: swipe,
    });

  } catch (error) {
    console.error('[CREATE SWIPE ASSET ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create swipe asset.',
    });
  }
}

// ─── COURSE DETAIL ─────────────────────────────────────────
async function getCourseDetail(req, res) {
  try {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            _count: {
              select: {
                createdCourses: { where: { status: 'PUBLISHED' } },
              },
            },
          },
        },
        modules: {
          include: { lessons: { orderBy: { orderIndex: 'asc' } } },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Course not found.',
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Course detail retrieved.',
      data: course,
    });

  } catch (error) {
    console.error('[GET COURSE DETAIL ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve course detail.',
    });
  }
}

// ─── APPROVE COURSE ────────────────────────────────────────
async function approveCourse(req, res) {
  try {
    const { courseId } = req.params;
    const { note } = req.body;

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'PUBLISHED',
        rejectionReason: null,
      },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Course approved.',
      data: { id: course.id, status: course.status },
    });

  } catch (error) {
    console.error('[APPROVE COURSE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to approve course.',
    });
  }
}

// ─── REJECT COURSE ─────────────────────────────────────────
async function rejectCourse(req, res) {
  try {
    const { courseId } = req.params;
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'reason is required.',
      });
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Course rejected.',
      data: { id: course.id, status: course.status },
    });

  } catch (error) {
    console.error('[REJECT COURSE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to reject course.',
    });
  }
}

module.exports = {
  getStagingQueue,
  getCourseDetail,
  approveCourse,
  rejectCourse,
  updateCourseStatus,
  getGlobalMetrics,
  getAffiliateLeaderboard,
  getUserGrid,
  updateUserRole,
  getSystemAssets,
  updateSystemAsset,
  createSwipeAsset,
};
