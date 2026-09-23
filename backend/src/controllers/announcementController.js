const { prisma } = require('../config/prisma');

// GET /api/v1/announcements?courseId=xxx — list announcements for a course
async function list(req, res) {
  try {
    const { courseId } = req.query;
    if (!courseId) return res.status(400).json({ success: false, statusCode: 400, message: 'courseId required' });

    const announcements = await prisma.announcement.findMany({
      where: { courseId, active: true },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    // If user is authenticated, mark which announcements they've read
    let readIds = [];
    if (req.user) {
      const reads = await prisma.announcementRead.findMany({
        where: {
          userId: req.user.id || req.user.userId,
          announcementId: { in: announcements.map(a => a.id) },
        },
        select: { announcementId: true },
      });
      readIds = reads.map(r => r.announcementId);
    }

    const data = announcements.map(a => ({ ...a, isRead: readIds.includes(a.id) }));

    res.json({ success: true, statusCode: 200, data });
  } catch (error) {
    console.error('[LIST ANNOUNCEMENTS ERROR]', error.message);
    res.status(500).json({ success: false, statusCode: 500, message: 'Failed to fetch announcements' });
  }
}

// GET /api/v1/announcements/admin/all — admin list all announcements
async function listAll(req, res) {
  try {
    const { page = 1, limit = 20, active } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (active !== undefined) where.active = active === 'true';

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true } },
          course: { select: { id: true, title: true } },
          _count: { select: { reads: true } },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limitNum,
      }),
      prisma.announcement.count({ where }),
    ]);

    res.json({ success: true, statusCode: 200, data: announcements, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error('[LIST ALL ANNOUNCEMENTS ERROR]', error.message);
    res.status(500).json({ success: false, statusCode: 500, message: 'Failed to fetch announcements' });
  }
}

// GET /api/v1/announcements/admin/creator — list creator's own announcements
async function listByCreator(req, res) {
  try {
    const userId = req.user.id || req.user.userId;
    const announcements = await prisma.announcement.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { reads: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    res.json({ success: true, statusCode: 200, data: announcements });
  } catch (error) {
    console.error('[LIST CREATOR ANNOUNCEMENTS ERROR]', error.message);
    res.status(500).json({ success: false, statusCode: 500, message: 'Failed to fetch announcements' });
  }
}

// GET /api/v1/announcements/student/feed — student's announcement feed from enrolled courses
async function studentFeed(req, res) {
  try {
    const userId = req.user.id || req.user.userId;

    // Get enrolled course IDs
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId },
      select: { courseId: true },
    });
    const courseIds = enrollments.map(e => e.courseId);

    if (courseIds.length === 0) {
      return res.json({ success: true, statusCode: 200, data: [], unreadCount: 0 });
    }

    const announcements = await prisma.announcement.findMany({
      where: { courseId: { in: courseIds }, active: true },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    // Mark read state
    const reads = await prisma.announcementRead.findMany({
      where: { userId, announcementId: { in: announcements.map(a => a.id) } },
      select: { announcementId: true },
    });
    const readIds = reads.map(r => r.announcementId);

    const data = announcements.map(a => ({ ...a, isRead: readIds.includes(a.id) }));
    const unreadCount = data.filter(a => !a.isRead).length;

    res.json({ success: true, statusCode: 200, data, unreadCount });
  } catch (error) {
    console.error('[STUDENT FEED ERROR]', error.message);
    res.status(500).json({ success: false, statusCode: 500, message: 'Failed to fetch announcement feed' });
  }
}

// GET /api/v1/announcements/unread-count — get unread count for current user
async function unreadCount(req, res) {
  try {
    const userId = req.user.id || req.user.userId;

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId },
      select: { courseId: true },
    });
    const courseIds = enrollments.map(e => e.courseId);

    if (courseIds.length === 0) {
      return res.json({ success: true, statusCode: 200, data: { unreadCount: 0 } });
    }

    const totalAnnouncements = await prisma.announcement.count({
      where: { courseId: { in: courseIds }, active: true },
    });

    const readCount = await prisma.announcementRead.count({
      where: {
        userId,
        announcement: { courseId: { in: courseIds } },
      },
    });

    res.json({ success: true, statusCode: 200, data: { unreadCount: Math.max(0, totalAnnouncements - readCount) } });
  } catch (error) {
    console.error('[UNREAD COUNT ERROR]', error.message);
    res.status(500).json({ success: false, statusCode: 500, message: 'Failed to get unread count' });
  }
}

// POST /api/v1/announcements — create (creator or admin)
async function create(req, res) {
  try {
    const { courseId, title, body, priority } = req.body;
    if (!courseId || !title?.trim() || !body?.trim()) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'courseId, title, and body are required' });
    }

    const userId = req.user.id || req.user.userId;

    // Verify creator owns the course (admins can post to any course)
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ success: false, statusCode: 404, message: 'Course not found' });

    const userRole = req.user.role;
    if (userRole !== 'ADMIN' && course.creatorId !== userId) {
      return res.status(403).json({ success: false, statusCode: 403, message: 'Only the course creator or admin can post announcements' });
    }

    const announcement = await prisma.announcement.create({
      data: { courseId, userId, title: title.trim(), body: body.trim(), priority: priority || 0 },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
    });

    // Notify all enrolled students
    const enrollments = await prisma.enrollment.findMany({ where: { courseId }, select: { studentId: true } });
    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map(e => ({
          userId: e.studentId,
          type: 'COURSE_ANNOUNCEMENT',
          title: `New announcement: ${title.trim()}`,
          message: body.trim().substring(0, 120),
          metadata: JSON.stringify({ courseId, announcementId: announcement.id }),
        })),
      });
    }

    res.status(201).json({ success: true, statusCode: 201, message: 'Announcement created', data: announcement });
  } catch (error) {
    console.error('[CREATE ANNOUNCEMENT ERROR]', error.message);
    res.status(500).json({ success: false, statusCode: 500, message: 'Failed to create announcement' });
  }
}

// PUT /api/v1/announcements/:id — update (creator who owns it or admin)
async function update(req, res) {
  try {
    const { id } = req.params;
    const { title, body, priority, active } = req.body;
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.role;

    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) return res.status(404).json({ success: false, statusCode: 404, message: 'Announcement not found' });

    if (userRole !== 'ADMIN' && announcement.userId !== userId) {
      return res.status(403).json({ success: false, statusCode: 403, message: 'Forbidden' });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(body !== undefined && { body: body.trim() }),
        ...(priority !== undefined && { priority }),
        ...(active !== undefined && { active }),
      },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
    });

    res.json({ success: true, statusCode: 200, message: 'Announcement updated', data: updated });
  } catch (error) {
    console.error('[UPDATE ANNOUNCEMENT ERROR]', error.message);
    res.status(500).json({ success: false, statusCode: 500, message: 'Failed to update announcement' });
  }
}

// DELETE /api/v1/announcements/:id — delete (creator who owns it or admin)
async function remove(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.role;

    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) return res.status(404).json({ success: false, statusCode: 404, message: 'Announcement not found' });

    if (userRole !== 'ADMIN' && announcement.userId !== userId) {
      return res.status(403).json({ success: false, statusCode: 403, message: 'Forbidden' });
    }

    await prisma.announcement.delete({ where: { id } });
    res.json({ success: true, statusCode: 200, message: 'Announcement deleted' });
  } catch (error) {
    console.error('[DELETE ANNOUNCEMENT ERROR]', error.message);
    res.status(500).json({ success: false, statusCode: 500, message: 'Failed to delete announcement' });
  }
}

// POST /api/v1/announcements/:id/mark-read — mark as read for current user
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user.userId;

    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) return res.status(404).json({ success: false, statusCode: 404, message: 'Announcement not found' });

    await prisma.announcementRead.upsert({
      where: { announcementId_userId: { announcementId: id, userId } },
      update: { readAt: new Date() },
      create: { announcementId: id, userId },
    });

    res.json({ success: true, statusCode: 200, message: 'Marked as read' });
  } catch (error) {
    console.error('[MARK READ ERROR]', error.message);
    res.status(500).json({ success: false, statusCode: 500, message: 'Failed to mark as read' });
  }
}

// POST /api/v1/announcements/mark-all-read — mark all as read for current user
async function markAllRead(req, res) {
  try {
    const userId = req.user.id || req.user.userId;

    // Get all active announcements from enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId },
      select: { courseId: true },
    });
    const courseIds = enrollments.map(e => e.courseId);

    if (courseIds.length === 0) {
      return res.json({ success: true, statusCode: 200, message: 'No announcements to mark' });
    }

    const announcements = await prisma.announcement.findMany({
      where: { courseId: { in: courseIds }, active: true },
      select: { id: true },
    });

    // Get already-read IDs
    const existingReads = await prisma.announcementRead.findMany({
      where: { userId, announcementId: { in: announcements.map(a => a.id) } },
      select: { announcementId: true },
    });
    const readIds = new Set(existingReads.map(r => r.announcementId));

    // Create reads for unread ones
    const unread = announcements.filter(a => !readIds.has(a.id));
    if (unread.length > 0) {
      await prisma.announcementRead.createMany({
        data: unread.map(a => ({ announcementId: a.id, userId })),
      });
    }

    res.json({ success: true, statusCode: 200, message: `Marked ${unread.length} as read` });
  } catch (error) {
    console.error('[MARK ALL READ ERROR]', error.message);
    res.status(500).json({ success: false, statusCode: 500, message: 'Failed to mark all as read' });
  }
}

module.exports = { list, listAll, listByCreator, studentFeed, unreadCount, create, update, remove, markAsRead, markAllRead };
