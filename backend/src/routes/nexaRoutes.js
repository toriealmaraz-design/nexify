/**
 * Nexa Routes — /api/v1/nexa
 */

const express = require('express');
const router = express.Router();
const { nexaScopeMiddleware } = require('../middleware/nexaScope');
const nexaController = require('../controllers/nexaController');

// All Nexa chat requests: scope middleware handles auth + role check
router.post('/chat', nexaScopeMiddleware, nexaController.chat);

module.exports = router;
