/**
 * Chatbot Reply Routes — /api/v1/chatbot-replies
 * Admin: CRUD for predefined replies.
 * Public: Chat matching endpoint.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const chatbotReplyController = require('../controllers/chatbotReplyController');

// Public: list all enabled replies (for NexaWidget fallback matching)
// Admin-only: full CRUD
router.get('/', authenticate, requireRole('ADMIN'), chatbotReplyController.listReplies);
router.get('/public', chatbotReplyController.listRepliesPublic);
router.post('/', authenticate, requireRole('ADMIN'), chatbotReplyController.createReply);
router.put('/:key', authenticate, requireRole('ADMIN'), chatbotReplyController.updateReply);
router.delete('/:key', authenticate, requireRole('ADMIN'), chatbotReplyController.deleteReply);
router.post('/seed', authenticate, requireRole('ADMIN'), chatbotReplyController.seedReplies);

module.exports = router;
