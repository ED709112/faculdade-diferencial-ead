const express = require('express');
const router = express.Router();
const turmaController = require('../controllers/turmaController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin'), turmaController.list);

router.get('/mine', authenticate, authorize('teacher'), turmaController.listMine);

router.get('/mine/:id/students', authenticate, authorize('teacher'), turmaController.getMineStudents);

router.get('/:id', authenticate, authorize('admin'), turmaController.getById);

router.get('/:id/students', authenticate, authorize('admin'), turmaController.getStudents);

router.get('/:id/available-students', authenticate, authorize('admin'), turmaController.getAvailableStudents);

router.post('/', authenticate, authorize('admin'), turmaController.create);

router.post('/:id/students', authenticate, authorize('admin'), turmaController.addStudent);

router.put('/:id', authenticate, authorize('admin'), turmaController.update);

router.delete('/:id', authenticate, authorize('admin'), turmaController.remove);

router.delete('/:id/students/:userId', authenticate, authorize('admin'), turmaController.removeStudent);

module.exports = router;
