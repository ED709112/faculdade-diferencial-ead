const express = require('express');
const router = express.Router();
const controller = require('../controllers/courseDurationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin', 'teacher'), controller.getAll);
router.get('/student', authenticate, controller.getByStudent);
router.get('/notifications', authenticate, controller.getNotifications);
router.get('/alerts', authenticate, authorize('admin'), controller.checkAlerts);
router.post('/', authenticate, authorize('admin', 'teacher'), controller.create);
router.post('/bulk', authenticate, authorize('admin', 'teacher'), controller.createBulk);
router.put('/:id', authenticate, authorize('admin', 'teacher'), controller.update);
router.delete('/:id', authenticate, authorize('admin', 'teacher'), controller.remove);
router.put('/notifications/:id/read', authenticate, controller.markAsRead);
router.put('/notifications/read-all', authenticate, controller.markAllAsRead);

module.exports = router;
