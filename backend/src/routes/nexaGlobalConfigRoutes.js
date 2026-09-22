/**
 * NexaGlobalConfig Routes — /api/v1/nexa-global-config
 * GET: public
 * PUT: admin only
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const nexaGlobalConfigController = require('../controllers/nexaGlobalConfigController');

// Public: get the singleton config
router.get('/', nexaGlobalConfigController.getConfig);

// Admin-only: update config
router.put('/', authenticate, requireRole('ADMIN'), nexaGlobalConfigController.updateConfig);

module.exports = router;
