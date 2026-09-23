/**
 * Order Controller
 * Handles checkout, order bumps, seat holds, and revenue partitioning.
 *
 * Covers: Checkout & Funnels Layer (REQ-GRO-01, REQ-GRO-02, REQ-GRO-03)
 *         Affiliate Network Layer (REQ-DIG-03 — Automated Revenue Partitioning)
 *
 * ⚠️ NEEDS REVIEW — Touches payments, commissions, and revenue splits.
 * This controller executes the financial split math. Route to a stronger
 * model for final review before treating as final.
 */

const { prisma } = require('../config/prisma');
const crypto = require('crypto');
const constants = require('../config/constants');

// ─── Helper: Generate idempotency key ──────────────────────
// Derives from phone + amount + short time window (PRD 3.7)
function generateIdempotencyKey(phone, amountGhs, courseId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const windowKey = Math.floor(timestamp / 300); // 5-minute window
  const raw = `${phone}|${amountGhs}|${courseId}|${windowKey}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32);
}

// ─── Helper: Check idempotency ─────────────────────────────
async function checkIdempotency(key) {
  if (!key) return null;
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: key },
    select: { id: true, paymentStatus: true },
  });
  return existing;
}

// ─── CHECKOUT ──────────────────────────────────────────────
async function checkout(req, res) {
  try {
    const {
      courseId,
      studentEmail,
      studentName,
      studentPhone,
      includeOrderBump = false,
      affiliateCode,
      paymentChannel = 'MOMO_MTN',
    } = req.body;

    // ── Validate inputs ──
    if (!courseId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'courseId is required.',
      });
    }

    if (!studentEmail || !studentName || !studentPhone) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'studentEmail, studentName, and studentPhone are required.',
      });
    }

    // ── Find course ──
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: { select: { id: true, fullName: true } },
        affiliateLinks: { where: { affiliateCode }, select: { id: true, affiliateId: true } },
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

    if (course.status !== 'PUBLISHED') {
      return res.status(422).json({
        success: false,
        statusCode: 422,
        error: 'UNPROCESSABLE_ENTITY',
        message: `Course is not available for purchase (status: ${course.status}).`,
      });
    }

    // ── Physical lab seat check (REQ-GRO-03) ──
    if (course.type === 'IN_PERSON_LAB') {
      if (course.maxSeats && course.bookedSeats >= course.maxSeats) {
        // Auto-add to waitlist
        await prisma.waitlist.upsert({
          where: { userId_courseId: { userId, courseId } },
          update: { notified: false },
          create: { userId, courseId },
        });
        return res.status(409).json({
          success: false,
          statusCode: 409,
          error: 'CONFLICT',
          message: 'Cohort Full. You have been added to the waitlist.',
          details: { waitlistAvailable: true, joinedWaitlist: true },
        });
      }
    }

    // ── Calculate prices ──
    const basePrice = course.priceGhs;
    const bumpPrice = (includeOrderBump && course.hasOrderBump)
      ? (course.orderBumpPriceGhs || 0)
      : 0;
    const totalAmount = basePrice + bumpPrice;

    // ── Determine platform fee rate ──
    let platformFeeRate = constants.PLATFORM_FEE_RATE;
    if (course.type === 'IN_PERSON_LAB') {
      platformFeeRate = course.platformFeeOverride
        ? course.platformFeeOverride
        : constants.LAB_PLATFORM_FEE_RATE;
    } else if (course.platformFeeOverride) {
      platformFeeRate = course.platformFeeOverride;
    }

    // ── Revenue Partitioning (REQ-DIG-03) ──
    // Round all money values to 2 decimal places before DB write
    const platformFee = Math.round((totalAmount * platformFeeRate) * 100) / 100;
    const distributablePool = Math.round((totalAmount - platformFee) * 100) / 100;

    // Determine affiliate share
    let affiliateShare = 0;
    let affiliateLinkId = null;

    if (affiliateCode) {
      const link = course.affiliateLinks[0];
      if (link) {
        affiliateLinkId = link.id;
        affiliateShare = Math.round((distributablePool * course.affiliateRate) * 100) / 100;
      }
    }

    const creatorShare = Math.round((distributablePool - affiliateShare) * 100) / 100;

    // ── Find or create student user ──
    let student = await prisma.user.findUnique({ where: { email: studentEmail } });
    let tempPassword = null;
    if (!student) {
      // Auto-create student account for guest checkout
      // Generate a random temporary password — user must change on first login
      tempPassword = crypto.randomBytes(8).toString('hex');
      const passwordHash = await import('bcryptjs').then(m => m.hash(tempPassword, 10));
      student = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: studentEmail,
          passwordHash,
          fullName: studentName,
          role: 'STUDENT',
          phone: studentPhone,
        },
      });
    }

    // ── Idempotency check (PRD 3.7) ──
    const idempotencyKey = generateIdempotencyKey(studentPhone, totalAmount, courseId);
    const existingOrder = await checkIdempotency(idempotencyKey);
    if (existingOrder && existingOrder.paymentStatus === 'SUCCESSFUL') {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Order already processed (idempotent retry).',
        data: {
          orderId: existingOrder.id,
          paymentStatus: existingOrder.paymentStatus,
          financialSummary: {
            basePriceGhs: basePrice,
            bumpIncluded: includeOrderBump && course.hasOrderBump,
            bumpPriceGhs: bumpPrice,
            totalPaidGhs: totalAmount,
            breakdown: {
              platformFeeGhs: platformFee,
              affiliateCommissionGhs: affiliateShare,
              creatorNetGhs: creatorShare,
            },
          },
        },
      });
    }

    // ── Create order within transaction ──
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          id: crypto.randomUUID(),
          studentId: student.id,
          courseId: course.id,
          affiliateLinkId,
          basePriceGhs: basePrice,
          includedBump: includeOrderBump && course.hasOrderBump,
          bumpPriceGhs: bumpPrice,
          totalAmountGhs: totalAmount,
          platformFeeGhs: platformFee,
          creatorShareGhs: creatorShare,
          affiliateShareGhs: affiliateShare,
          paymentChannel: paymentChannel.toUpperCase(),
          paymentStatus: 'PENDING',
          idempotencyKey,
        },
      });

      // For physical labs: lock seat (REQ-GRO-03)
      if (course.type === 'IN_PERSON_LAB' && course.maxSeats) {
        await tx.course.update({
          where: { id: course.id },
          data: { bookedSeats: { increment: 1 } },
        });
      }

      // Simulate payment success (dev mode — always succeeds)
      const transactionRef = `TX-${paymentChannel.substring(5)}-GH-${Date.now()}`;

      // Mark payment successful
      await tx.order.update({
        where: { id: newOrder.id },
        data: {
          paymentStatus: 'SUCCESSFUL',
        },
      });

      // Create payment log
      await tx.paymentLog.create({
        data: {
          id: crypto.randomUUID(),
          orderId: newOrder.id,
          transactionRef,
          channel: paymentChannel.toUpperCase(),
          amountGhs: totalAmount,
          status: 'SUCCESSFUL',
          rawPayload: JSON.stringify({ simulation: true, timestamp: new Date().toISOString() }),
        },
      });

      // If affiliate commission > 0, create commission record
      if (affiliateShare > 0 && affiliateLinkId) {
        const link = await tx.affiliateLink.findUnique({
          where: { id: affiliateLinkId },
          select: { affiliateId: true },
        });

        if (link) {
          await tx.commission.create({
            data: {
              id: crypto.randomUUID(),
              orderId: newOrder.id,
              affiliateId: link.affiliateId,
              amountGhs: affiliateShare,
              status: 'PENDING', // PENDING until refund window passes (PRD 3.3)
            },
          });
        }
      }

      // Create enrollment for student
      await tx.enrollment.create({
        data: {
          id: crypto.randomUUID(),
          studentId: student.id,
          courseId: course.id,
          accessGranted: true,
          progress: 0,
        },
      });

      return newOrder;
    });

    // ── Return response ──
    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Order processed successfully.',
      data: {
        orderId: order.id,
        paymentStatus: order.paymentStatus,
        transactionRef: `TX-${paymentChannel.substring(5)}-GH-${Date.now()}`,
        financialSummary: {
          basePriceGhs: basePrice,
          bumpIncluded: includeOrderBump && course.hasOrderBump,
          bumpPriceGhs: bumpPrice,
          totalPaidGhs: totalAmount,
          breakdown: {
            platformFeeGhs: platformFee,
            affiliateCommissionGhs: affiliateShare,
            creatorNetGhs: creatorShare,
          },
        },
        accessGrant: {
          courseId: course.id,
          classroomUrl: `/learn/${course.id}`,
        },
        // Guest users: temporary password for first login (must be changed)
        guestTempPassword: tempPassword || null,
      },
    });

  } catch (error) {
    console.error('[CHECKOUT ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Checkout processing failed.',
    });
  }
}

// ─── GET ORDER (by ID) ─────────────────────────────────────
async function getOrder(req, res) {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        course: { select: { title: true, slug: true } },
        student: { select: { fullName: true, email: true } },
        affiliateLink: { select: { affiliateCode: true } },
        commission: { select: { amountGhs: true, status: true } },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Order not found.',
      });
    }

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Order retrieved.',
      data: order,
    });

  } catch (error) {
    console.error('[GET ORDER ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve order.',
    });
  }
}

// ─── GET STUDENT ORDERS ────────────────────────────────────
async function getStudentOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where: { studentId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { title: true, slug: true, coverImageUrl: true } },
        affiliateLink: { select: { affiliateCode: true } },
      },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Student orders retrieved.',
      data: orders,
    });

  } catch (error) {
    console.error('[STUDENT ORDERS ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve orders.',
    });
  }
}

module.exports = {
  checkout,
  getOrder,
  getStudentOrders,
};
