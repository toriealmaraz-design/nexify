/**
 * Certificate Routes — /api/v1/certificates
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const certificateController = require('../controllers/certificateController');

// Authenticated: get certificate for a specific course
router.get('/:courseId', authenticate, certificateController.getCertificate);

// Public: verify certificate by its public certificateId
router.get('/verify/:certificateId', certificateController.verifyCertificate);

// Authenticated: generate certificate when course is completed
router.post('/:courseId/generate', authenticate, certificateController.generateCertificate);

module.exports = router;
