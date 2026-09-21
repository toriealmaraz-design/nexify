/**
 * Affiliate Routes — /api/v1/affiliates
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission, requireRole } = require('../middleware/rbac');
const affiliateController = require('../controllers/affiliateController');

// Click tracking: Public (sets cookie)
router.get('/track', affiliateController.trackClick);

// Protected: Affiliate operations
router.post('/links', authenticate, requirePermission('affiliate:manage'), affiliateController.generateLink);
router.get('/dashboard', authenticate, requirePermission('affiliate:dashboard'), affiliateController.getDashboard);
router.get('/links', authenticate, requirePermission('affiliate:read'), affiliateController.listLinks);
router.get('/swipes/:courseId', authenticate, requirePermission('affiliate:read'), affiliateController.getSwipes);

module.exports = router;
