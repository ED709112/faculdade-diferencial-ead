const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', settingsController.getSiteConfig);

router.post('/test-email', authenticate, authorize('admin'), settingsController.testEmail);

router.get('/:group', authenticate, authorize('admin'), settingsController.getGroup);

router.put('/', authenticate, authorize('admin'), settingsController.update);

module.exports = router;
