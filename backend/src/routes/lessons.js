const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/module/:moduleId', authenticate, lessonController.getByModule);

router.get('/:id', authenticate, lessonController.getById);

router.post('/', authenticate, authorize('admin', 'teacher'), lessonController.create);

router.put('/:id', authenticate, authorize('admin', 'teacher'), lessonController.update);

router.delete('/:id', authenticate, authorize('admin', 'teacher'), lessonController.delete);

router.post('/:id/comment', authenticate, lessonController.addComment);

router.get('/:id/comments', authenticate, lessonController.getComments);

router.post('/:id/complete', authenticate, lessonController.markComplete);

module.exports = router;
