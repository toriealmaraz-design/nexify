const { prisma } = require('../config/prisma');

// GET /api/v1/announcements?courseId=xxx — list announcements for a course
async function list(req, res) {
  try {
    const { courseId } = req.query;
    if (!courseId) return res.status(400).json({ message: 'courseId required' });

    const announcements = await prisma.announcement.findMany({
      where: { courseId, active: true },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ data: announcements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
}

// POST /api/v1/announcements — create (creator only)
async function create(req, res) {
  try {
    const { courseId, title, body, priority } = req.body;
    if (!courseId || !title?.trim() || !body?.trim()) {
      return res.status(400).json({ message: 'courseId, title, and body are required' });
    }

    // Verify creator owns the course
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.creatorId !== req.user.id) return res.status(403).json({ message: 'Only the course creator can post announcements' });

    const announcement = await prisma.announcement.create({
      data: { courseId, userId: req.user.id, title: title.trim(), body: body.trim(), priority: priority || 0 },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
    });

    // Notify all enrolled students
    const enrollments = await prisma.enrollment.findMany({ where: { courseId }, select: { studentId: true } });
    await prisma.notification.createMany({
      data: enrollments.map(e => ({
        userId: e.studentId,
        type: 'COURSE_ANNOUNCEMENT',
        title: `New announcement: ${title.trim()}`,
        message: body.trim().substring(0, 120),
        metadata: JSON.stringify({ courseId, announcementId: announcement.id }),
      })),
    });

    res.status(201).json({ data: announcement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
}

// DELETE /api/v1/announcements/:id — delete (creator only)
async function remove(req, res) {
  try {
    const { id } = req.params;
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) return res.status(404).json({ message: 'Not found' });
    if (announcement.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    await prisma.announcement.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
}

module.exports = { list, create, remove };
