/**
 * Progress Routes — /api/v1/enrollments/:enrollmentId/progress
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth');
const progressController = require('../controllers/progressController');

// All routes require authentication
router.get('/', authenticate, progressController.getEnrollmentProgress);
router.put('/:lessonId', authenticate, progressController.updateLessonProgress);

module.exports = router;
