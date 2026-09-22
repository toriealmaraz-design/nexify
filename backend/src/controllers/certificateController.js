/**
 * Certificate Controller
 * Handles certificate retrieval, public verification, and generation on course completion.
 */

const { prisma } = require('../config/prisma');

// ─── GET CERTIFICATE FOR COURSE ───────────────────────────────
// GET /api/v1/certificates/:courseId
async function getCertificate(req, res) {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    const certificate = await prisma.certificate.findFirst({
      where: { userId, courseId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImageUrl: true,
            creator: { select: { fullName: true } },
          },
        },
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'No certificate found for this course.',
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Certificate retrieved.',
      data: certificate,
    });
  } catch (error) {
    console.error('[GET CERTIFICATE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve certificate.',
    });
  }
}

// ─── VERIFY CERTIFICATE (public) ─────────────────────────────
// GET /api/v1/certificates/verify/:certificateId
async function verifyCertificate(req, res) {
  try {
    const { certificateId } = req.params;

    const certificate = await prisma.certificate.findUnique({
      where: { certificateId },
      include: {
        course: {
          select: {
            title: true,
            slug: true,
            creator: { select: { fullName: true } },
          },
        },
        user: { select: { fullName: true } },
      },
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Certificate not found.',
      });
    }

    if (!certificate.completedAt) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'NOT_COMPLETED',
        message: 'This certificate has not yet been issued (course not completed).',
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Certificate is valid.',
      data: {
        certificateId: certificate.certificateId,
        holderName: certificate.user.fullName,
        courseTitle: certificate.course.title,
        instructorName: certificate.course.creator.fullName,
        issuedAt: certificate.completedAt,
        courseSlug: certificate.course.slug,
      },
    });
  } catch (error) {
    console.error('[VERIFY CERTIFICATE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify certificate.',
    });
  }
}

// ─── GENERATE CERTIFICATE ────────────────────────────────────
// POST /api/v1/certificates/:courseId/generate
async function generateCertificate(req, res) {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    // Check enrollment and course completion
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, courseId },
      include: {
        course: { select: { title: true, id: true } },
        lessonProgress: true,
      },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_ENROLLED',
        message: 'You are not enrolled in this course.',
      });
    }

    if (enrollment.progress < 100) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'COURSE_NOT_COMPLETED',
        message: `Course must be 100% complete. Current progress: ${enrollment.progress}%`,
      });
    }

    // Check if certificate already exists
    const existing = await prisma.certificate.findFirst({
      where: { userId, courseId },
    });

    if (existing) {
      if (existing.completedAt) {
        return res.status(200).json({
          success: true,
          statusCode: 200,
          message: 'Certificate already exists.',
          data: existing,
        });
      }
      // Update existing (was issued but not yet marked complete)
      const updated = await prisma.certificate.update({
        where: { id: existing.id },
        data: { completedAt: new Date() },
      });
      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Certificate issued.',
        data: updated,
      });
    }

    // Create new certificate
    const certificate = await prisma.certificate.create({
      data: {
        userId,
        courseId,
        enrolledAt: enrollment.createdAt,
        completedAt: new Date(),
      },
      include: {
        course: {
          select: {
            title: true,
            slug: true,
            creator: { select: { fullName: true } },
          },
        },
        user: { select: { fullName: true, email: true } },
      },
    });

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Certificate generated successfully.',
      data: certificate,
    });
  } catch (error) {
    console.error('[GENERATE CERTIFICATE ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to generate certificate.',
    });
  }
}

module.exports = {
  getCertificate,
  verifyCertificate,
  generateCertificate,
};
