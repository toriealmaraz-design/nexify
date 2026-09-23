/**
 * Waitlist Routes — /api/v1/waitlist
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const waitlistController = require('../controllers/waitlistController');

// Join or leave waitlist (authenticated)
router.post('/join', authenticate, waitlistController.joinWaitlist);
router.post('/leave', authenticate, waitlistController.leaveWaitlist);

// Get waitlist for a course (authenticated)
router.get('/:courseId', authenticate, waitlistController.getWaitlist);

// Get current user's waitlist (authenticated)
router.get('/my/waitlist', authenticate, waitlistController.getMyWaitlist);

module.exports = router;
