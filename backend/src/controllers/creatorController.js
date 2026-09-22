/**
 * Creator Controller
 * Handles public creator profiles and their published courses.
 */

const { prisma } = require('../config/prisma');

// ─── GET CREATOR PUBLIC PROFILE ─────────────────────────────
async function getCreatorProfile(req, res) {
  try {
    const { creatorId } = req.params;

    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Creator not found.',
      });
    }

    // Aggregate stats
    const [courses, enrollmentStats, reviewStats, revenueStats] = await Promise.all([
      // Published course count
      prisma.course.count({
        where: { creatorId, status: 'PUBLISHED' },
      }),
      // Total students (distinct enrollments with successful orders)
      prisma.enrollment.count({
        where: {
          course: { creatorId, status: 'PUBLISHED' },
          accessGranted: true,
        },
      }),
      // Average rating across all published courses
      prisma.review.aggregate({
        where: { course: { creatorId, status: 'PUBLISHED' } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      // Total revenue (creator share from successful orders)
      prisma.order.aggregate({
        where: {
          course: { creatorId, status: 'PUBLISHED' },
          paymentStatus: 'SUCCESSFUL',
        },
        _sum: { creatorShareGhs: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Creator profile retrieved.',
      data: {
        id: creator.id,
        fullName: creator.fullName,
        avatarUrl: creator.avatarUrl,
        memberSince: creator.createdAt,
        stats: {
          courseCount: courses,
          totalStudents: enrollmentStats,
          averageRating: reviewStats._avg.rating
            ? Math.round(reviewStats._avg.rating * 10) / 10
            : null,
          totalReviews: reviewStats._count.rating,
          totalRevenueGhs: revenueStats._sum.creatorShareGhs || 0,
        },
      },
    });

  } catch (error) {
    console.error('[GET CREATOR PROFILE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve creator profile.',
    });
  }
}

// ─── GET CREATOR'S PUBLISHED COURSES ───────────────────────
async function getCreatorCourses(req, res) {
  try {
    const { creatorId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Verify creator exists
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true, fullName: true },
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Creator not found.',
      });
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: { creatorId, status: 'PUBLISHED' },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          priceGhs: true,
          coverImageUrl: true,
          type: true,
          createdAt: true,
          _count: { select: { enrollments: true } },
        },
      }),
      prisma.course.count({ where: { creatorId, status: 'PUBLISHED' } }),
    ]);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Creator courses retrieved.',
      meta: {
        totalItems: total,
        itemCount: courses.length,
        itemsPerPage: limitNum,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
      },
      data: courses.map(c => ({
        ...c,
        studentCount: c._count.enrollments,
        _count: undefined,
      })),
    });

  } catch (error) {
    console.error('[GET CREATOR COURSES ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve creator courses.',
    });
  }
}

module.exports = {
  getCreatorProfile,
  getCreatorCourses,
};
