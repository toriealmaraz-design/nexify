/**
 * Gamification Routes — /api/v1/gamification
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const gamificationController = require('../controllers/gamificationController');

// ─── Combined User Stats ───────────────────────────────────
router.get('/me', authenticate, gamificationController.getUserStats);

// ─── User Points & Level ───────────────────────────────────
router.post('/points/award', authenticate, gamificationController.awardPoints);
router.get('/points', authenticate, gamificationController.getUserPoints);
router.get('/level', authenticate, gamificationController.getUserLevel);
router.get('/badges', authenticate, gamificationController.getUserBadges);
router.post('/level/check', authenticate, gamificationController.checkAndLevelUp);

// ─── Daily Login ───────────────────────────────────────────
router.post('/login-streak', authenticate, gamificationController.trackDailyLogin);

// ─── Leaderboard ───────────────────────────────────────────
router.get('/leaderboard', gamificationController.getLeaderboard);

// ─── Rewards ───────────────────────────────────────────────
router.get('/rewards', authenticate, gamificationController.getRewards);
router.post('/rewards/claim', authenticate, gamificationController.claimReward);

// ─── Seed Defaults (admin utility) ─────────────────────────
router.post('/seed', authenticate, gamificationController.seedDefaults);

// ─── Admin: All badges/rewards (manage) ─────────────────────
router.get('/admin/badges', authenticate, gamificationController.getAllBadges);
router.post('/admin/badges', authenticate, gamificationController.createBadge);
router.delete('/admin/badges/:id', authenticate, gamificationController.deleteBadge);
router.get('/admin/rewards', authenticate, gamificationController.getAllRewards);
router.post('/admin/rewards', authenticate, gamificationController.createReward);
router.delete('/admin/rewards/:id', authenticate, gamificationController.deleteReward);
router.get('/admin/leaderboard', authenticate, gamificationController.getAdminLeaderboard);

module.exports = router;
