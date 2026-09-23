/**
 * Community Routes — /api/v1/community
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const communityController = require('../controllers/communityController');

// ─── Post Routes ─────────────────────────────────────
router.post('/posts', authenticate, communityController.createPost);
router.get('/posts', authenticate, communityController.getPosts);
router.get('/posts/:id', authenticate, communityController.getPostById);
router.put('/posts/:id', authenticate, communityController.updatePost);
router.delete('/posts/:id', authenticate, communityController.deletePost);
router.post('/posts/:id/like', authenticate, communityController.likePost);

// ─── Comment Routes ──────────────────────────────────
router.post('/comments', authenticate, communityController.createComment);
router.get('/posts/:postId/comments', authenticate, communityController.getComments);
router.delete('/comments/:id', authenticate, communityController.deleteComment);

module.exports = router;
