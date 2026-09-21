/**
 * Nexa Routes — /api/v1/nexa
 */

const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/rbac');
const { nexaScopeMiddleware } = require('../middleware/nexaScope');
const nexaController = require('../controllers/nexaController');

// All Nexa chat requests: authenticate + scope + process
router.post('/chat', requireRole('ADMIN', 'CREATOR', 'AFFILIATE', 'STUDENT'), nexaScopeMiddleware, nexaController.chat);

module.exports = router;
