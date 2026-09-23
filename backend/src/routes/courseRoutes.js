/**
 * Course Routes — /api/v1/courses
 */

const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requirePermission, requireRole } = require('../middleware/rbac');
const courseController = require('../controllers/courseController');
const reviewController = require('../controllers/reviewController');

// Public: Browse published courses
router.get('/', courseController.listCourses);

// Authenticated: Personalized recommendations
router.get('/recommendations/me', authenticate, courseController.getRecommendations);

// Optional auth: Get single course (enriches if logged in)
router.get('/:id', optionalAuth, courseController.getCourse);

// Authenticated: Course CRUD
router.post('/', authenticate, requirePermission('course:create'), courseController.createCourse);
router.put('/:id', authenticate, requirePermission('course:read_own'), courseController.updateCourse);

// Modules & Lessons (nested under courses)
router.post('/:courseId/modules', authenticate, requirePermission('course:create'), courseController.createModule);
router.post('/modules/:moduleId/lessons', authenticate, requirePermission('course:create'), courseController.createLesson);

// Creator stats
router.get('/stats/creator', authenticate, requireRole('CREATOR', 'ADMIN'), courseController.getCreatorCourseStats);

// Reviews (nested under courses)
router.get('/:courseId/reviews', reviewController.getCourseReviews);
router.post('/:courseId/reviews', authenticate, reviewController.createOrUpdateReview);

// Payout request stub
router.post('/payout-request', authenticate, requireRole('CREATOR', 'ADMIN'), (req, res) => {
  res.status(201).json({ success: true, message: 'Payout request submitted' });
});

module.exports = router;
