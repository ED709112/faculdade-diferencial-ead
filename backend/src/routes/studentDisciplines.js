const express = require('express');
const router = express.Router();
const controller = require('../controllers/disciplineController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('student'));

router.get('/', controller.studentGetDisciplines);
router.get('/course/:courseId', controller.studentGetCourseDisciplines);
router.get('/course/:courseId/module/:moduleId', controller.studentGetModuleDiscipline);
router.get('/:id', controller.studentGetDisciplineById);
router.get('/:disciplineId/materials', controller.studentGetMaterials);

module.exports = router;
