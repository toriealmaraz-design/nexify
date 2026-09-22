/**
 * Advertisement Routes — /api/v1/advertisements
 * GET: public (list active ads)
 * POST/PUT/DELETE: admin only
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const advertisementController = require('../controllers/advertisementController');

// Public: list active ads (optionally filter by placement)
router.get('/', advertisementController.listAds);

// Admin-only: full CRUD + seed
router.post('/', authenticate, requireRole('ADMIN'), advertisementController.createAd);
router.put('/:id', authenticate, requireRole('ADMIN'), advertisementController.updateAd);
router.delete('/:id', authenticate, requireRole('ADMIN'), advertisementController.deleteAd);
router.post('/seed', authenticate, requireRole('ADMIN'), advertisementController.seedAds);

module.exports = router;
