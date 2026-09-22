const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const q = require('../controllers/questionController');

router.get('/', authenticate, q.listByLesson);
router.post('/', authenticate, q.create);
router.post('/:id/answers', authenticate, q.createAnswer);
router.put('/:id/upvote', authenticate, q.toggleUpvote);
router.put('/:id/resolve', authenticate, requireRole('CREATOR'), q.resolve);

module.exports = router;
