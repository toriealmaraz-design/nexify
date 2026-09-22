/**
 * Payout Routes — /api/v1/payouts
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const payoutController = require('../controllers/payoutController');

// Authenticated: payout history
router.get('/', authenticate, requirePermission('affiliate:read'), payoutController.getPayoutHistory);

// Authenticated: request a payout
router.post('/request', authenticate, requirePermission('affiliate:manage'), payoutController.requestPayout);

// Authenticated: get available balance
router.get('/balance', authenticate, requirePermission('affiliate:read'), payoutController.getBalance);

// Admin: list all payouts with filters
router.get('/admin', authenticate, requirePermission('admin:metrics'), payoutController.listAllPayouts);

// Admin: update payout status
router.put('/:id/status', authenticate, requirePermission('admin:metrics'), payoutController.updatePayoutStatus);

module.exports = router;
