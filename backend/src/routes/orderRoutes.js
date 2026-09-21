/**
 * Order Routes — /api/v1/orders
 */

const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const orderController = require('../controllers/orderController');

// Public/Authenticated: Checkout (open to guest checkout via studentEmail)
router.post('/checkout', optionalAuth, orderController.checkout);

// Protected: Order lookup
router.get('/my-orders', authenticate, requirePermission('order:read_own'), orderController.getStudentOrders);
router.get('/:id', authenticate, orderController.getOrder);

module.exports = router;
