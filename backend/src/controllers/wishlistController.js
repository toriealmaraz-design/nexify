/**
 * Wishlist Controller
 * Handles adding, removing, and listing wishlist items.
 */

const { prisma } = require('../config/prisma');

// ─── GET USER WISHLIST ──────────────────────────────────────
async function getWishlist(req, res) {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            priceGhs: true,
            coverImageUrl: true,
            type: true,
            status: true,
            creator: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Wishlist retrieved.',
      data: items,
    });

  } catch (error) {
    console.error('[GET WISHLIST ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve wishlist.',
    });
  }
}

// ─── ADD TO WISHLIST ────────────────────────────────────────
async function addToWishlist(req, res) {
  try {
    const { courseId } = req.params;

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

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_courseId: {
          userId: req.user.userId,
          courseId,
        },
      },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Course already in wishlist.',
        data: existing,
      });
    }

    const item = await prisma.wishlist.create({
      data: {
        userId: req.user.userId,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            priceGhs: true,
            coverImageUrl: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Course added to wishlist.',
      data: item,
    });

  } catch (error) {
    console.error('[ADD TO WISHLIST ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to add course to wishlist.',
    });
  }
}

// ─── REMOVE FROM WISHLIST ───────────────────────────────────
async function removeFromWishlist(req, res) {
  try {
    const { courseId } = req.params;

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_courseId: {
          userId: req.user.userId,
          courseId,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Wishlist item not found.',
      });
    }

    await prisma.wishlist.delete({
      where: { id: existing.id },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Course removed from wishlist.',
    });

  } catch (error) {
    console.error('[REMOVE FROM WISHLIST ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to remove course from wishlist.',
    });
  }
}

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
