/**
 * Progress Controller
 * Handles per-lesson progress tracking for enrollments.
 */

const { prisma } = require('../config/prisma');

// ─── GET USER ENROLLMENTS ────────────────────────────
async function getEnrollments(req, res) {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: req.user.userId },
      include: {
        course: {
          select: {
            id: true, title: true, slug: true, coverImageUrl: true,
            type: true, priceGhs: true, hasOrderBump: true, orderBumpTitle: true,
            creator: { select: { fullName: true } },
          },
        },
        _count: { select: { lessonProgress: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = enrollments.map(e => ({
      id: e.id,
      courseId: e.courseId,
      course: e.course,
      progress: e.progress,
      streakCount: e.streakCount,
      accessGranted: e.accessGranted,
      createdAt: e.createdAt,
      totalLessons: e._count.lessonProgress,
    }));

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Enrollments retrieved.',
      data,
    });
  } catch (error) {
    console.error('[GET ENROLLMENTS ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve enrollments.',
    });
  }
}

// ─── GET ENROLLMENT PROGRESS ─────────────────────────
async function getEnrollmentProgress(req, res) {
  try {
    const { enrollmentId } = req.params;

    // Verify enrollment exists and belongs to user (or admin)
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Enrollment not found.',
      });
    }

    if (enrollment.studentId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'FORBIDDEN',
        message: 'You can only view your own enrollment progress.',
      });
    }

    const progress = await prisma.lessonProgress.findMany({
      where: { enrollmentId },
      orderBy: { lessonId: 'asc' },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Enrollment progress retrieved.',
      data: {
        enrollmentId,
        courseId: enrollment.courseId,
        overallProgress: enrollment.progress,
        lessons: progress,
      },
    });

  } catch (error) {
    console.error('[GET ENROLLMENT PROGRESS ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve enrollment progress.',
    });
  }
}

// ─── UPDATE LESSON PROGRESS ────────────────────────────────
async function updateLessonProgress(req, res) {
  try {
    const { enrollmentId, lessonId } = req.params;
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'completed must be a boolean.',
      });
    }

    // Verify enrollment exists and belongs to user (or admin)
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: {
              include: { lessons: { select: { id: true } } },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Enrollment not found.',
      });
    }

    if (enrollment.studentId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'FORBIDDEN',
        message: 'You can only update your own progress.',
      });
    }

    // Verify lesson belongs to the enrollment's course
    const allLessonIds = enrollment.course.modules.flatMap(m => m.lessons.map(l => l.id));
    if (!allLessonIds.includes(lessonId)) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Lesson not found in this course.',
      });
    }

    // Upsert lesson progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId,
        },
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
      },
      create: {
        enrollmentId,
        lessonId,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    // Recalculate overall enrollment progress percentage
    const allProgress = await prisma.lessonProgress.findMany({
      where: { enrollmentId },
    });

    const completedCount = allProgress.filter(p => p.completed).length;
    const totalLessons = allLessonIds.length;
    const overallProgress = totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0;

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progress: overallProgress },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: completed ? 'Lesson marked as complete.' : 'Lesson marked as incomplete.',
      data: {
        lessonId,
        completed: progress.completed,
        completedAt: progress.completedAt,
        overallProgress,
      },
    });

  } catch (error) {
    console.error('[UPDATE LESSON PROGRESS ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update lesson progress.',
    });
  }
}

module.exports = {
  getEnrollments,
  getEnrollmentProgress,
  updateLessonProgress,
};
