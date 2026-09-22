/**
 * Admin Routes — /api/v1/admin
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const adminController = require('../controllers/adminController');

// All admin routes require ADMIN role
router.get('/staging-queue', authenticate, requireRole('ADMIN'), adminController.getStagingQueue);
router.get('/courses/:courseId', authenticate, requireRole('ADMIN'), adminController.getCourseDetail);
router.put('/courses/:courseId/approve', authenticate, requireRole('ADMIN'), adminController.approveCourse);
router.put('/courses/:courseId/reject', authenticate, requireRole('ADMIN'), adminController.rejectCourse);
router.put('/courses/:courseId/status', authenticate, requireRole('ADMIN'), adminController.updateCourseStatus);
router.get('/metrics', authenticate, requireRole('ADMIN'), adminController.getGlobalMetrics);
router.get('/affiliates', authenticate, requireRole('ADMIN'), adminController.getAffiliateLeaderboard);
router.get('/users', authenticate, requireRole('ADMIN'), adminController.getUserGrid);
router.put('/users/:userId/role', authenticate, requireRole('ADMIN'), adminController.updateUserRole);
router.get('/assets', authenticate, requireRole('ADMIN'), adminController.getSystemAssets);
router.post('/assets', authenticate, requireRole('ADMIN'), adminController.updateSystemAsset);
router.post('/courses/:courseId/swipes', authenticate, requireRole('ADMIN', 'CREATOR'), adminController.createSwipeAsset);

module.exports = router;
