const { prisma } = require('../config/prisma');

// GET /api/v1/questions?lessonId=xxx — get all questions for a lesson
async function listByLesson(req, res) {
  try {
    const { lessonId } = req.query;
    if (!lessonId) return res.status(400).json({ message: 'lessonId is required' });

    const questions = await prisma.question.findMany({
      where: { lessonId },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        answers: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true, role: true } } },
          orderBy: [{ isOfficial: 'desc' }, { upvotes: 'desc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ data: questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
}

// POST /api/v1/questions — create a question
async function create(req, res) {
  try {
    const { lessonId, body } = req.body;
    if (!lessonId || !body?.trim()) return res.status(400).json({ message: 'lessonId and body are required' });

    const question = await prisma.question.create({
      data: { lessonId, userId: req.user.id, body: body.trim() },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
    res.status(201).json({ data: question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create question' });
  }
}

// POST /api/v1/questions/:id/answers — post an answer
async function createAnswer(req, res) {
  try {
    const { id } = req.params;
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ message: 'body is required' });

    // Check if user is the course creator (for official answer)
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const lesson = await prisma.lesson.findUnique({ where: { id: question.lessonId }, include: { module: { include: { course: true } } } });
    const isCreator = lesson.module.course.creatorId === req.user.id;
    const isOfficial = isCreator && req.body.isOfficial;

    const answer = await prisma.answer.create({
      data: { questionId: id, userId: req.user.id, body: body.trim(), isOfficial },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true, role: true } } },
    });
    res.status(201).json({ data: answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to post answer' });
  }
}

// PUT /api/v1/questions/:id/upvote — toggle upvote
async function toggleUpvote(req, res) {
  try {
    const { id } = req.params;
    const question = await prisma.question.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
    });
    res.json({ data: { upvotes: question.upvotes } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upvote' });
  }
}

// PUT /api/v1/questions/:id/resolve — mark resolved (creator only)
async function resolve(req, res) {
  try {
    const { id } = req.params;
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) return res.status(404).json({ message: 'Not found' });

    const lesson = await prisma.lesson.findUnique({ where: { id: question.lessonId }, include: { module: { include: { course: true } } } });
    if (lesson.module.course.creatorId !== req.user.id) return res.status(403).json({ message: 'Only the course creator can resolve questions' });

    const updated = await prisma.question.update({ where: { id }, data: { resolved: !question.resolved } });
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to resolve question' });
  }
}

module.exports = { listByLesson, create, createAnswer, toggleUpvote, resolve };
