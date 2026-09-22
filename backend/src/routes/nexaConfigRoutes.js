/**
 * Nexa Config Routes — /api/v1/nexa-config
 * Admin-only: CRUD for Nexa AI endpoint and system-prompt configuration.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const nexaConfigController = require('../controllers/nexaConfigController');

router.get('/', authenticate, requireRole('ADMIN'), nexaConfigController.listConfigs);
router.get('/:key', authenticate, requireRole('ADMIN'), nexaConfigController.getConfig);
router.post('/', authenticate, requireRole('ADMIN'), nexaConfigController.upsertConfig);
router.delete('/:key', authenticate, requireRole('ADMIN'), nexaConfigController.deleteConfig);

module.exports = router;
