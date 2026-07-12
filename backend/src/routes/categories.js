const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', categoryController.getAll);

router.get('/:id', categoryController.getById);

router.post('/', authenticate, authorize('admin'), categoryController.create);

router.put('/:id', authenticate, authorize('admin'), categoryController.update);

router.delete('/:id', authenticate, authorize('admin'), categoryController.delete);

router.put('/reorder', authenticate, authorize('admin'), categoryController.reorder);

module.exports = router;
