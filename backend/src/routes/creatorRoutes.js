/**
 * Creator Routes — /api/v1/creators
 */

const express = require('express');
const router = express.Router();
const creatorController = require('../controllers/creatorController');

// Public: creator profile and stats
router.get('/:creatorId', creatorController.getCreatorProfile);

// Public: creator's published courses
router.get('/:creatorId/courses', creatorController.getCreatorCourses);

module.exports = router;
