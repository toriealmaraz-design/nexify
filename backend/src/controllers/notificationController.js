/**
 * Notification Controller
 * Handles listing, marking one as read, and marking all as read.
 */

const { prisma } = require('../config/prisma');

// ─── GET USER NOTIFICATIONS ─────────────────────────────────
async function getNotifications(req, res) {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId: req.user.userId,
      ...(unreadOnly === 'true' ? { read: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: req.user.userId, read: false },
      }),
    ]);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Notifications retrieved.',
      meta: {
        totalItems: total,
        itemCount: notifications.length,
        itemsPerPage: limitNum,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        unreadCount,
      },
      data: notifications,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve notifications.',
    });
  }
}

// ─── MARK ONE AS READ ───────────────────────────────────────
async function markAsRead(req, res) {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Notification not found.',
      });
    }

    if (notification.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'FORBIDDEN',
        message: 'You can only update your own notifications.',
      });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Notification marked as read.',
      data: updated,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update notification.',
    });
  }
}

// ─── MARK ALL AS READ ───────────────────────────────────────
async function markAllAsRead(req, res) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.userId,
        read: false,
      },
      data: { read: true },
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'All notifications marked as read.',
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to mark all notifications as read.',
    });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
