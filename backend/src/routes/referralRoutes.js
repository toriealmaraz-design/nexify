/**
 * Referral Routes — /api/v1/affiliates/referral-stats, /api/v1/affiliates/leaderboard, /api/v1/affiliates/referral
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const referralController = require('../controllers/referralController');

// Authenticated: get user's referral stats
router.get('/referral-stats', authenticate, requirePermission('affiliate:read'), referralController.getReferralStats);

// Authenticated: get top 10 affiliates leaderboard
router.get('/leaderboard', authenticate, requirePermission('affiliate:read'), referralController.getLeaderboard);

// Authenticated: record a new referral
router.post('/referral', authenticate, requirePermission('affiliate:manage'), referralController.recordReferral);

module.exports = router;
