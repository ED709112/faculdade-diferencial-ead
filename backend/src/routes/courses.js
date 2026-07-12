const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { courseValidators, paginationValidator } = require('../middleware/validators');

router.get('/', optionalAuth, paginationValidator, courseController.getAll);

router.get('/featured', courseController.getFeatured);

router.get('/category/:categoryId', courseController.getByCategory);

router.get('/slug/:slug', courseController.getBySlug);

router.get('/:id', courseController.getById);

router.post('/', authenticate, authorize('admin', 'teacher'), courseValidators.create, courseController.create);

router.put('/:id', authenticate, authorize('admin', 'teacher'), courseValidators.update, courseController.update);

router.delete('/:id', authenticate, authorize('admin'), courseController.delete);

router.put('/:id/featured', authenticate, authorize('admin'), courseController.toggleFeatured);

router.get('/:id/students', authenticate, authorize('admin', 'teacher'), paginationValidator, courseController.getEnrolledStudents);

module.exports = router;
