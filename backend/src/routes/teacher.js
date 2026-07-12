const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticate, authorize } = require('../middleware/auth');
const { paginationValidator } = require('../middleware/validators');

router.use(authenticate, authorize('teacher'));

router.get('/dashboard', teacherController.getDashboard);

router.get('/courses', teacherController.getMyCourses);

router.get('/students', paginationValidator, teacherController.getStudents);

router.get('/students/:studentId', teacherController.getStudentProgress);

module.exports = router;
