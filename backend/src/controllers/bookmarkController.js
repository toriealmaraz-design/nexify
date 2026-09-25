/**
 * Bookmark Controller
 * Toggle, list, and check bookmark status for lessons.
 */

const { prisma } = require('../config/prisma');

// ─── TOGGLE BOOKMARK ─────────────────────────────────
async function toggleBookmark(req, res) {
  try {
    const { lessonId } = req.body;
    const userId = req.user.userId;

    if (!lessonId) {
      return res.status(400).json({
        success: false, statusCode: 400, error: 'BAD_REQUEST',
        message: 'lessonId is required.',
      });
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      return res.status(404).json({
        success: false, statusCode: 404, error: 'NOT_FOUND',
        message: 'Lesson not found.',
      });
    }

    const existing = await prisma.bookmark.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return res.status(200).json({
        success: true, statusCode: 200,
        message: 'Bookmark removed.',
        data: { bookmarked: false },
      });
    }

    const bookmark = await prisma.bookmark.create({
      data: { userId, lessonId },
    });

    return res.status(201).json({
      success: true, statusCode: 201,
      message: 'Lesson bookmarked.',
      data: { bookmarked: true, id: bookmark.id },
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to toggle bookmark.',
    });
  }
}

// ─── GET BOOKMARKS FOR CURRENT USER ──────────────────
async function getMyBookmarks(req, res) {
  try {
    const userId = req.user.userId;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        lesson: { select: { id: true, title: true, module: { select: { id: true, title: true, course: { select: { id: true, title: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Bookmarks retrieved.',
      data: bookmarks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve bookmarks.',
    });
  }
}

// ─── CHECK IF LESSON IS BOOKMARKED ───────────────────
async function checkBookmark(req, res) {
  try {
    const { lessonId } = req.params;
    const userId = req.user.userId;

    const bookmark = await prisma.bookmark.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Bookmark status retrieved.',
      data: { bookmarked: !!bookmark, id: bookmark?.id || null },
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to check bookmark.',
    });
  }
}

module.exports = {
  toggleBookmark,
  getMyBookmarks,
  checkBookmark,
};
