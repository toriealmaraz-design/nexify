/**
 * Community Controller
 * Handles community posts and comments for courses.
 */

const { prisma } = require('../config/prisma');

// ─── CREATE POST ─────────────────────────────────────
async function createPost(req, res) {
  try {
    const { courseId, title, body, category, pinned } = req.body;
    const userId = req.user.userId;

    if (!courseId || !title?.trim() || !body?.trim()) {
      return res.status(400).json({
        success: false, statusCode: 400, error: 'BAD_REQUEST',
        message: 'courseId, title, and body are required.',
      });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({
        success: false, statusCode: 404, error: 'NOT_FOUND',
        message: 'Course not found.',
      });
    }

    const validCategories = ['announcement', 'discussion', 'question'];
    const postCategory = category && validCategories.includes(category) ? category : 'discussion';

    const post = await prisma.communityPost.create({
      data: {
        courseId,
        userId,
        title: title.trim(),
        body: body.trim(),
        category: postCategory,
        pinned: pinned === true,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
        _count: { select: { comments: true } },
      },
    });

    return res.status(201).json({
      success: true, statusCode: 201,
      message: 'Post created successfully.',
      data: post,
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to create post.',
    });
  }
}

// ─── GET POSTS ───────────────────────────────────────
async function getPosts(req, res) {
  try {
    const { courseId } = req.query;
    const { category, page = 1, limit = 20 } = req.query;

    const where = {};
    if (courseId) where.courseId = courseId;
    if (category) where.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [
          { pinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: parseInt(limit),
      }),
      prisma.communityPost.count({ where }),
    ]);

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Posts retrieved.',
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve posts.',
    });
  }
}

// ─── GET POST BY ID ──────────────────────────────────
async function getPostById(req, res) {
  try {
    const { id } = req.params;

    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
        course: { select: { id: true, title: true, slug: true } },
        _count: { select: { comments: true } },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false, statusCode: 404, error: 'NOT_FOUND',
        message: 'Post not found.',
      });
    }

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Post retrieved.',
      data: post,
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve post.',
    });
  }
}

// ─── UPDATE POST ─────────────────────────────────────
async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const { title, body, category, pinned } = req.body;
    const userId = req.user.userId;

    const post = await prisma.communityPost.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({
        success: false, statusCode: 404, error: 'NOT_FOUND',
        message: 'Post not found.',
      });
    }

    if (post.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false, statusCode: 403, error: 'FORBIDDEN',
        message: 'You can only edit your own posts.',
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (body !== undefined) updateData.body = body.trim();
    if (category !== undefined) {
      const validCategories = ['announcement', 'discussion', 'question'];
      if (validCategories.includes(category)) updateData.category = category;
    }
    if (pinned !== undefined) updateData.pinned = pinned;

    const updated = await prisma.communityPost.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
        _count: { select: { comments: true } },
      },
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Post updated successfully.',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to update post.',
    });
  }
}

// ─── DELETE POST ─────────────────────────────────────
async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const post = await prisma.communityPost.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({
        success: false, statusCode: 404, error: 'NOT_FOUND',
        message: 'Post not found.',
      });
    }

    if (post.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false, statusCode: 403, error: 'FORBIDDEN',
        message: 'You can only delete your own posts.',
      });
    }

    await prisma.communityPost.delete({ where: { id } });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Post deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete post.',
    });
  }
}

// ─── LIKE POST ───────────────────────────────────────
async function likePost(req, res) {
  try {
    const { id } = req.params;

    const post = await prisma.communityPost.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({
        success: false, statusCode: 404, error: 'NOT_FOUND',
        message: 'Post not found.',
      });
    }

    const updated = await prisma.communityPost.update({
      where: { id },
      data: { likes: { increment: 1 } },
      select: { id: true, likes: true },
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Post liked.',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to like post.',
    });
  }
}

// ─── CREATE COMMENT ──────────────────────────────────
async function createComment(req, res) {
  try {
    const { postId, body, parentId } = req.body;
    const userId = req.user.userId;

    if (!postId || !body?.trim()) {
      return res.status(400).json({
        success: false, statusCode: 400, error: 'BAD_REQUEST',
        message: 'postId and body are required.',
      });
    }

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({
        success: false, statusCode: 404, error: 'NOT_FOUND',
        message: 'Post not found.',
      });
    }

    // Validate parent comment exists and belongs to same post
    if (parentId) {
      const parentComment = await prisma.communityComment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment || parentComment.postId !== postId) {
        return res.status(400).json({
          success: false, statusCode: 400, error: 'BAD_REQUEST',
          message: 'Invalid parent comment.',
        });
      }
    }

    const comment = await prisma.communityComment.create({
      data: {
        postId,
        userId,
        body: body.trim(),
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
      },
    });

    return res.status(201).json({
      success: true, statusCode: 201,
      message: 'Comment added successfully.',
      data: comment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to create comment.',
    });
  }
}

// ─── GET COMMENTS ────────────────────────────────────
async function getComments(req, res) {
  try {
    const { postId } = req.params;

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({
        success: false, statusCode: 404, error: 'NOT_FOUND',
        message: 'Post not found.',
      });
    }

    // Fetch all comments for the post
    const allComments = await prisma.communityComment.findMany({
      where: { postId },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Build nested tree structure
    const commentMap = {};
    const rootComments = [];

    allComments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    allComments.forEach(comment => {
      if (comment.parentId && commentMap[comment.parentId]) {
        commentMap[comment.parentId].replies.push(commentMap[comment.id]);
      } else {
        rootComments.push(commentMap[comment.id]);
      }
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Comments retrieved.',
      data: rootComments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve comments.',
    });
  }
}

// ─── DELETE COMMENT ──────────────────────────────────
async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const comment = await prisma.communityComment.findUnique({ where: { id } });
    if (!comment) {
      return res.status(404).json({
        success: false, statusCode: 404, error: 'NOT_FOUND',
        message: 'Comment not found.',
      });
    }

    if (comment.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false, statusCode: 403, error: 'FORBIDDEN',
        message: 'You can only delete your own comments.',
      });
    }

    await prisma.communityComment.delete({ where: { id } });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete comment.',
    });
  }
}

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  createComment,
  getComments,
  deleteComment,
};
