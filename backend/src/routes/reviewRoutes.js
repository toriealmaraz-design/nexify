/**
 * Review Routes — /api/v1/courses/:courseId/reviews
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// Public: list reviews for a course
router.get('/', reviewController.getCourseReviews);

// Auth: create/update own review (must have purchased course)
router.post('/', authenticate, reviewController.createOrUpdateReview);

module.exports = router;
