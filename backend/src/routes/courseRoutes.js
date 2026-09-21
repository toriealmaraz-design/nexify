/**
 * Course Routes — /api/v1/courses
 */

const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requirePermission, requireRole } = require('../middleware/rbac');
const courseController = require('../controllers/courseController');

// Public: Browse published courses
router.get('/', courseController.listCourses);

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

module.exports = router;
