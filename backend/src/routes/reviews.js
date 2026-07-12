const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middleware/auth');
const { paginationValidator } = require('../middleware/validators');

router.get('/course/:courseId', paginationValidator, reviewController.getByCourse);

router.post('/', authenticate, reviewController.create);

router.put('/:id', authenticate, reviewController.update);

router.delete('/:id', authenticate, reviewController.delete);

router.get('/', authenticate, authorize('admin'), paginationValidator, reviewController.getAll);

router.put('/:id/respond', authenticate, authorize('admin'), reviewController.respond);

module.exports = router;
