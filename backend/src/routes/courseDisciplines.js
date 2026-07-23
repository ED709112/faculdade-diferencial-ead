const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/courseDisciplineController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/disciplines', ctrl.getAllDisciplinesForAdmin);
router.get('/courses/:courseId/modules', ctrl.getModulesByCourse);
router.get('/courses/:courseId/disciplines', ctrl.getCourseDisciplines);
router.get('/courses/:courseId/disciplines/available', ctrl.getUnlinkedDisciplines);
router.post('/courses/:courseId/disciplines', ctrl.linkDiscipline);
router.delete('/courses/:courseId/disciplines/:disciplineId', ctrl.unlinkDiscipline);
router.put('/courses/:courseId/disciplines/:disciplineId/sort', ctrl.updateSortOrder);

module.exports = router;
