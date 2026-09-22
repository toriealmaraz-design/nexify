const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const a = require('../controllers/announcementController');

router.get('/', authenticate, a.list);
router.post('/', authenticate, requireRole('CREATOR', 'ADMIN'), a.create);
router.delete('/:id', authenticate, requireRole('CREATOR', 'ADMIN'), a.remove);

module.exports = router;
