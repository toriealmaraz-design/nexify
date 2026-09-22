/**
 * Review Controller
 * Handles listing reviews for a course and creating/updating a user's review.
 */

const { prisma } = require('../config/prisma');

// ─── LIST REVIEWS FOR A COURSE (Public) ────────────────────
async function getCourseReviews(req, res) {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Verify course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Course not found.',
      });
    }

    const [reviews, total, ratingStats] = await Promise.all([
      prisma.review.findMany({
        where: { courseId },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, avatarUrl: true } },
        },
      }),
      prisma.review.count({ where: { courseId } }),
      prisma.review.aggregate({
        where: { courseId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Course reviews retrieved.',
      meta: {
        totalItems: total,
        itemCount: reviews.length,
        itemsPerPage: limitNum,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        averageRating: ratingStats._avg.rating
          ? Math.round(ratingStats._avg.rating * 10) / 10
          : null,
        totalReviews: ratingStats._count.rating,
      },
      data: reviews,
    });

  } catch (error) {
    console.error('[GET COURSE REVIEWS ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve reviews.',
    });
  }
}

// ─── CREATE / UPDATE REVIEW ─────────────────────────────────
async function createOrUpdateReview(req, res) {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Rating must be an integer between 1 and 5.',
      });
    }

    // Verify course exists and is published
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Course not found.',
      });
    }

    // Check user has purchased the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'FORBIDDEN',
        message: 'You must purchase this course before leaving a review.',
      });
    }

    // Upsert: create if not exists, update if exists
    const review = await prisma.review.upsert({
      where: {
        courseId_userId: {
          courseId,
          userId: req.user.userId,
        },
      },
      update: {
        rating,
        comment: comment || null,
      },
      create: {
        courseId,
        userId: req.user.userId,
        rating,
        comment: comment || null,
      },
      include: {
        user: { select: { fullName: true, avatarUrl: true } },
      },
    });

    const status = review.createdAt === review.updatedAt ? 201 : 200;
    return res.status(status).json({
      success: true,
      statusCode: status,
      message: status === 201 ? 'Review created.' : 'Review updated.',
      data: review,
    });

  } catch (error) {
    console.error('[CREATE/UPDATE REVIEW ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to save review.',
    });
  }
}

module.exports = {
  getCourseReviews,
  createOrUpdateReview,
};
