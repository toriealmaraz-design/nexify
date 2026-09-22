/**
 * Progress Routes — /api/v1/enrollments/:enrollmentId/progress
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth');
const progressController = require('../controllers/progressController');

// List all enrollments for the current user
router.get('/', authenticate, progressController.getEnrollments);

// All other routes require enrollment ID
router.get('/:enrollmentId/progress', authenticate, progressController.getEnrollmentProgress);
router.put('/:enrollmentId/progress/:lessonId', authenticate, progressController.updateLessonProgress);

module.exports = router;
