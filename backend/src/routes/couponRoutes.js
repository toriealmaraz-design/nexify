/**
 * Coupon Routes — /api/v1/coupons
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const couponController = require('../controllers/couponController');

// Validate coupon (authenticated user)
router.get('/validate/:code', authenticate, couponController.validateCoupon);

// Admin: Create coupon
router.post('/', authenticate, requirePermission('admin:metrics'), couponController.createCoupon);

// Admin: List all coupons
router.get('/', authenticate, requirePermission('admin:metrics'), couponController.listCoupons);

// Admin: Update coupon
router.put('/:id', authenticate, requirePermission('admin:metrics'), couponController.updateCoupon);

// Admin: Deactivate coupon
router.delete('/:id', authenticate, requirePermission('admin:metrics'), couponController.deactivateCoupon);

module.exports = router;
