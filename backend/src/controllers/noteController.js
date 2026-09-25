/**
 * Note Controller
 * CRUD for student notes on lessons.
 */

const { prisma } = require('../config/prisma');

// ─── CREATE NOTE ─────────────────────────────────────
async function createNote(req, res) {
  try {
    const { lessonId, content, timestamp } = req.body;
    const userId = req.user.userId;

    if (!lessonId || !content?.trim()) {
      return res.status(400).json({
        success: false, statusCode: 400, error: 'BAD_REQUEST',
        message: 'lessonId and content are required.',
      });
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      return res.status(404).json({
        success: false, statusCode: 404, error: 'NOT_FOUND',
        message: 'Lesson not found.',
      });
    }

    const note = await prisma.note.create({
      data: {
        userId,
        lessonId,
        content: content.trim(),
        timestamp: timestamp || 0,
      },
    });

    return res.status(201).json({
      success: true, statusCode: 201,
      message: 'Note saved.',
      data: note,
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to save note.',
    });
  }
}

// ─── GET NOTES FOR A LESSON ─────────────────────────
async function getNotesByLesson(req, res) {
  try {
    const { lessonId } = req.params;
    const userId = req.user.userId;

    const notes = await prisma.note.findMany({
      where: { lessonId, userId },
      orderBy: { timestamp: 'asc' },
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Notes retrieved.',
      data: notes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve notes.',
    });
  }
}

// ─── GET ALL NOTES FOR CURRENT USER ──────────────────
async function getMyNotes(req, res) {
  try {
    const userId = req.user.userId;

    const notes = await prisma.note.findMany({
      where: { userId },
      include: {
        lesson: { select: { id: true, title: true, module: { select: { id: true, title: true, course: { select: { id: true, title: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'My notes retrieved.',
      data: notes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve notes.',
    });
  }
}

// ─── UPDATE NOTE ─────────────────────────────────────
async function updateNote(req, res) {
  try {
    const { id } = req.params;
    const { content, timestamp } = req.body;
    const userId = req.user.userId;

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({
        success: false, statusCode: 404, error: 'NOT_FOUND',
        message: 'Note not found.',
      });
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(content?.trim() && { content: content.trim() }),
        ...(timestamp !== undefined && { timestamp }),
      },
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Note updated.',
      data: note,
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to update note.',
    });
  }
}

// ─── DELETE NOTE ─────────────────────────────────────
async function deleteNote(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({
        success: false, statusCode: 404, error: 'NOT_FOUND',
        message: 'Note not found.',
      });
    }

    await prisma.note.delete({ where: { id } });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Note deleted.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete note.',
    });
  }
}

module.exports = {
  createNote,
  getNotesByLesson,
  getMyNotes,
  updateNote,
  deleteNote,
};
