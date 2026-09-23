/**
 * Waitlist Controller
 * Handles join/leave/get for course waitlists.
 */

const { prisma } = require('../config/prisma');

// ─── JOIN WAITLIST ──────────────────────────────────
async function joinWaitlist(req, res) {
  try {
    const { courseId } = req.body;
    const userId = req.user.userId;

    if (!courseId) {
      return res.status(400).json({
        success: false, statusCode: 400, error: 'BAD_REQUEST',
        message: 'courseId is required.',
      });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({
        success: false, statusCode: 404, error: 'NOT_FOUND',
        message: 'Course not found.',
      });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: userId, courseId } },
    });
    if (existingEnrollment) {
      return res.status(400).json({
        success: false, statusCode: 400, error: 'BAD_REQUEST',
        message: 'Already enrolled in this course.',
      });
    }

    // Join waitlist (upsert to avoid duplicates)
    const entry = await prisma.waitlist.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { notified: false },
      create: { userId, courseId },
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Added to waitlist.',
      data: { id: entry.id, joinedAt: entry.joinedAt },
    });
  } catch (error) {
    console.error('[JOIN WAITLIST ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to join waitlist.',
    });
  }
}

// ─── LEAVE WAITLIST ─────────────────────────────────
async function leaveWaitlist(req, res) {
  try {
    const { courseId } = req.body;
    const userId = req.user.userId;

    await prisma.waitlist.deleteMany({
      where: { userId, courseId },
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Removed from waitlist.',
    });
  } catch (error) {
    console.error('[LEAVE WAITLIST ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to leave waitlist.',
    });
  }
}

// ─── GET COURSE WAITLIST ────────────────────────────
async function getWaitlist(req, res) {
  try {
    const { courseId } = req.params;

    const entries = await prisma.waitlist.findMany({
      where: { courseId },
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Waitlist retrieved.',
      data: entries,
    });
  } catch (error) {
    console.error('[GET WAITLIST ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve waitlist.',
    });
  }
}

// ─── CHECK USER WAITLIST STATUS ─────────────────────
async function getMyWaitlist(req, res) {
  try {
    const userId = req.user.userId;

    const entries = await prisma.waitlist.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true, slug: true, type: true } } },
      orderBy: { joinedAt: 'desc' },
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'My waitlist retrieved.',
      data: entries,
    });
  } catch (error) {
    console.error('[GET MY WAITLIST ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve waitlist.',
    });
  }
}

module.exports = {
  joinWaitlist,
  leaveWaitlist,
  getWaitlist,
  getMyWaitlist,
};
