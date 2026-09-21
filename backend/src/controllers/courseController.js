/**
 * Course Controller
 * Handles course CRUD, module/lesson management, and staging workflows.
 *
 * Covers: Learning & Workshops Layer (REQ-DOM-01, REQ-DOM-02, REQ-DOM-03)
 */

const { prisma } = require('../config/prisma');
const slugify = require('slugify');

const constants = require('../config/constants');

// ─── Helper: Generate unique slug ──────────────────────────
function generateSlug(title) {
  const base = slugify(title, { lower: true, strict: true });
  return base.substring(0, 80);
}

// ─── Helper: Validate teaser URL ───────────────────────────
function validateTeaserUrl(url) {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return 'teaserUrl is required. Every course must have a 30-90 second trailer video URL.';
  }
  // Basic URL format check
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith('http')) {
      return 'teaserUrl must be a valid HTTP/HTTPS URL.';
    }
  } catch {
    return 'teaserUrl must be a valid URL format.';
  }
  return null;
}

// ─── LIST PUBLISHED COURSES (Public) ───────────────────────
async function listCourses(req, res) {
  try {
    const { type, search, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      status: 'PUBLISHED',
      ...(type && type !== 'all' ? { type } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      } : {}),
    };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { fullName: true } },
          _count: { select: { orders: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Published courses retrieved.',
      meta: {
        totalItems: total,
        itemCount: courses.length,
        itemsPerPage: limitNum,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
      },
      data: courses,
    });

  } catch (error) {
    console.error('[LIST COURSES ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve courses.',
    });
  }
}

// ─── GET SINGLE COURSE ─────────────────────────────────────
async function getCourse(req, res) {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        creator: { select: { fullName: true, email: true } },
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: { orderBy: { orderIndex: 'asc' } },
          },
        },
        reviews: {
          include: { student: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { orders: true } },
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
      message: 'Course retrieved.',
      data: course,
    });

  } catch (error) {
    console.error('[GET COURSE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve course.',
    });
  }
}

// ─── CREATE COURSE ─────────────────────────────────────────
async function createCourse(req, res) {
  try {
    const {
      title,
      description,
      type = 'DIGITAL',
      priceGhs,
      affiliateRate,
      teaserUrl,
      hasOrderBump,
      orderBumpTitle,
      orderBumpPriceGhs,
      maxSeats,
      venueLocation,
      labDates,
      // September 2026 additions
      depositGhs,
      balanceDueDays,
      platformFeeOverride,
      venueId,
      instructorId,
    } = req.body;

    // Validate teaser URL (REQ-DOM-01)
    const teaserError = validateTeaserUrl(teaserUrl);
    if (teaserError) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: teaserError,
      });
    }

    // Validate price
    if (!priceGhs || priceGhs < 10.00) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'priceGhs must be at least GH₵ 10.00.',
      });
    }

    // Validate physical lab fields
    if (type === 'IN_PERSON_LAB') {
      if (!maxSeats || maxSeats <= 0) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          error: 'BAD_REQUEST',
          message: 'IN_PERSON_LAB courses require maxSeats > 0.',
        });
      }
    }

    const slug = generateSlug(title);

    // Create course — defaults to PENDING_APPROVAL
    const course = await prisma.course.create({
      data: {
        creatorId: req.user.userId,
        title,
        slug,
        description,
        type,
        priceGhs,
        affiliateRate: affiliateRate || constants.DEFAULT_AFFILIATE_RATE,
        teaserUrl: teaserUrl.trim(),
        hasOrderBump: hasOrderBump || false,
        orderBumpTitle: orderBumpTitle || null,
        orderBumpPriceGhs: orderBumpPriceGhs || 0,
        maxSeats: type === 'IN_PERSON_LAB' ? maxSeats : 0,
        bookedSeats: 0,
        venueLocation: venueLocation || null,
        labDates: labDates || null,
        // September 2026 additions
        depositGhs: depositGhs || null,
        balanceDueDays: balanceDueDays || null,
        platformFeeOverride: platformFeeOverride || null,
        venueId: venueId || null,
        instructorId: instructorId || null,
        status: 'PENDING_APPROVAL',
      },
      include: {
        creator: { select: { fullName: true } },
      },
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Course created and submitted for admin approval.',
      data: course,
    });

  } catch (error) {
    console.error('[CREATE COURSE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create course.',
    });
  }
}

// ─── UPDATE COURSE ─────────────────────────────────────────
async function updateCourse(req, res) {
  try {
    const { id } = req.params;

    // Only creators can update their own courses; admins can update any
    const course = await prisma.course.findUnique({ where: { id } });
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
        message: 'You can only update your own courses.',
      });
    }

    const {
      title,
      description,
      type,
      priceGhs,
      affiliateRate,
      teaserUrl,
      hasOrderBump,
      orderBumpTitle,
      orderBumpPriceGhs,
      maxSeats,
      venueLocation,
      labDates,
      depositGhs,
      balanceDueDays,
      platformFeeOverride,
      venueId,
      instructorId,
    } = req.body;

    // Re-validate teaser if provided
    if (teaserUrl) {
      const teaserError = validateTeaserUrl(teaserUrl);
      if (teaserError) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          error: 'BAD_REQUEST',
          message: teaserError,
        });
      }
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(title && { title, slug: generateSlug(title) }),
        ...(description && { description }),
        ...(type && { type }),
        ...(priceGhs && { priceGhs }),
        ...(affiliateRate && { affiliateRate }),
        ...(teaserUrl && { teaserUrl: teaserUrl.trim() }),
        ...(hasOrderBump !== undefined && { hasOrderBump }),
        ...(orderBumpTitle !== undefined && { orderBumpTitle }),
        ...(orderBumpPriceGhs !== undefined && { orderBumpPriceGhs }),
        ...(maxSeats !== undefined && { maxSeats }),
        ...(venueLocation !== undefined && { venueLocation }),
        ...(labDates !== undefined && { labDates }),
        ...(depositGhs !== undefined && { depositGhs }),
        ...(balanceDueDays !== undefined && { balanceDueDays }),
        ...(platformFeeOverride !== undefined && { platformFeeOverride }),
        ...(venueId !== undefined && { venueId }),
        ...(instructorId !== undefined && { instructorId }),
      },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Course updated.',
      data: updated,
    });

  } catch (error) {
    console.error('[UPDATE COURSE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update course.',
    });
  }
}

// ─── CREATE MODULE ─────────────────────────────────────────
async function createModule(req, res) {
  try {
    const { courseId } = req.params;
    const { title, orderIndex = 0 } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Module title is required.',
      });
    }

    // Verify ownership
    const course = await prisma.course.findUnique({ where: { id: courseId } });
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
        message: 'You can only modify your own courses.',
      });
    }

    const module = await prisma.module.create({
      data: {
        courseId,
        title,
        orderIndex,
      },
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Module created successfully.',
      data: module,
    });

  } catch (error) {
    console.error('[CREATE MODULE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create module.',
    });
  }
}

// ─── CREATE LESSON ─────────────────────────────────────────
async function createLesson(req, res) {
  try {
    const { moduleId } = req.params;
    const { title, videoUrl, content, orderIndex = 0, isFreePreview = false } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Lesson title is required.',
      });
    }

    // Verify module belongs to user's course
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Module not found.',
      });
    }

    if (module.course.creatorId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'FORBIDDEN',
        message: 'You can only modify your own courses.',
      });
    }

    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
        title,
        videoUrl: videoUrl || null,
        content: content || null,
        orderIndex,
        isFreePreview,
      },
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Lesson added to module.',
      data: lesson,
    });

  } catch (error) {
    console.error('[CREATE LESSON ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create lesson.',
    });
  }
}

// ─── GET COURSE STATS (Creator Dashboard) ─────────────────
async function getCreatorCourseStats(req, res) {
  try {
    const courses = await prisma.course.findMany({
      where: { creatorId: req.user.userId },
      include: {
        _count: { select: { orders: true } },
        orders: {
          where: { paymentStatus: 'SUCCESSFUL' },
          select: { totalAmountGhs: true },
        },
      },
    });

    const stats = courses.map(course => ({
      id: course.id,
      title: course.title,
      type: course.type,
      status: course.status,
      priceGhs: course.priceGhs,
      totalSales: course._count.orders,
      totalRevenue: course.orders.reduce((sum, o) => sum + o.totalAmountGhs, 0),
    }));

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Creator course statistics retrieved.',
      data: stats,
    });

  } catch (error) {
    console.error('[CREATOR STATS ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve course statistics.',
    });
  }
}

module.exports = {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  createModule,
  createLesson,
  getCreatorCourseStats,
};
