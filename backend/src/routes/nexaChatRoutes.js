const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const n = require('../controllers/nexaChatController');

router.post('/chat', authenticate, n.handleChat);
router.get('/conversations', authenticate, n.listConversations);
router.get('/conversations/:id', authenticate, n.getConversation);
router.delete('/conversations/:id', authenticate, n.deleteConversation);

module.exports = router;
