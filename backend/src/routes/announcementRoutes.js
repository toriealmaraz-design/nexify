const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const ctrl = require('../controllers/announcementController');

// Student feed (must be before /:id routes)
router.get('/student/feed', authenticate, ctrl.studentFeed);
router.get('/unread-count', authenticate, ctrl.unreadCount);
router.post('/mark-all-read', authenticate, ctrl.markAllRead);

// Admin routes
router.get('/admin/all', authenticate, requireRole('ADMIN'), ctrl.listAll);
router.get('/admin/creator', authenticate, requireRole('CREATOR'), ctrl.listByCreator);

// Public course announcements (with read status if authenticated)
router.get('/', authenticate, ctrl.list);

// CRUD
router.post('/', authenticate, requireRole('CREATOR', 'ADMIN'), ctrl.create);
router.put('/:id', authenticate, requireRole('CREATOR', 'ADMIN'), ctrl.update);
router.delete('/:id', authenticate, requireRole('CREATOR', 'ADMIN'), ctrl.remove);

// Mark as read
router.post('/:id/mark-read', authenticate, ctrl.markAsRead);

module.exports = router;
