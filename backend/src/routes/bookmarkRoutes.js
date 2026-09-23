/**
 * Bookmark Routes — /api/v1/bookmarks
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const bookmarkController = require('../controllers/bookmarkController');

// Toggle bookmark on/off for a lesson
router.post('/toggle', authenticate, bookmarkController.toggleBookmark);

// Get current user's bookmarks
router.get('/me', authenticate, bookmarkController.getMyBookmarks);

// Check if a specific lesson is bookmarked
router.get('/lesson/:lessonId', authenticate, bookmarkController.checkBookmark);

module.exports = router;
