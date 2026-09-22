/**
 * Wishlist Routes — /api/v1/wishlist
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const wishlistController = require('../controllers/wishlistController');

// All routes require authentication
router.get('/', authenticate, wishlistController.getWishlist);
router.post('/:courseId', authenticate, wishlistController.addToWishlist);
router.delete('/:courseId', authenticate, wishlistController.removeFromWishlist);

module.exports = router;
