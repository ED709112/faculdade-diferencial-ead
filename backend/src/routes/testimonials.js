const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', testimonialController.getAll);

router.post('/', authenticate, authorize('admin'), testimonialController.create);

router.put('/:id', authenticate, authorize('admin'), testimonialController.update);

router.delete('/:id', authenticate, authorize('admin'), testimonialController.delete);

module.exports = router;
