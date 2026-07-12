const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', bannerController.getAll);

router.post('/', authenticate, authorize('admin'), bannerController.create);

router.put('/:id', authenticate, authorize('admin'), bannerController.update);

router.delete('/:id', authenticate, authorize('admin'), bannerController.delete);

router.put('/reorder', authenticate, authorize('admin'), bannerController.reorder);

module.exports = router;
