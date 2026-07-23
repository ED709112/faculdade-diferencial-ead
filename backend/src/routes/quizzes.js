const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticate, authorize } = require('../middleware/auth');
const { quizValidators } = require('../middleware/validators');

router.get('/course/:courseId', authenticate, quizController.getByCourse);

router.get('/:id', authenticate, quizController.getById);

router.post('/', authenticate, authorize('admin', 'teacher'), quizController.create);

router.put('/:id', authenticate, authorize('admin', 'teacher'), quizController.update);

router.delete('/:id', authenticate, authorize('admin', 'teacher'), quizController.delete);

router.post('/:id/start', authenticate, quizController.startAttempt);

router.post('/:id/submit', authenticate, quizController.submitAttempt);

router.get('/:id/attempts', authenticate, quizController.getAttempts);

router.get('/:id/results/:attemptId', authenticate, quizController.getResults);

router.get('/:id/results', authenticate, quizController.getResults);

module.exports = router;
