const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/course/:courseId', authenticate, authorize('admin', 'teacher'), moduleController.getByCourse);

router.post('/', authenticate, authorize('admin', 'teacher'), moduleController.create);

router.put('/:id', authenticate, authorize('admin', 'teacher'), moduleController.update);

router.delete('/:id', authenticate, authorize('admin', 'teacher'), moduleController.delete);

router.put('/reorder', authenticate, authorize('admin', 'teacher'), moduleController.reorder);

module.exports = router;
