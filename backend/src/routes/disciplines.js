const express = require('express');
const router = express.Router();
const controller = require('../controllers/disciplineController');
const { authenticate, authorize } = require('../middleware/auth');
const { createUpload } = require('../utils/upload');

const uploadMaterial = createUpload('discipline-materials', [
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/webm', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
], 50 * 1024 * 1024);

router.use(authenticate, authorize('teacher'));

router.get('/', controller.getMyDisciplines);
router.get('/:id', controller.getDisciplineById);
router.post('/', controller.createDiscipline);
router.put('/:id', controller.updateDiscipline);
router.delete('/:id', controller.deleteDiscipline);

router.get('/:disciplineId/materials', controller.getMaterials);
router.post('/:disciplineId/materials', (req, res, next) => {
  uploadMaterial.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Arquivo muito grande. Máximo 50MB.' });
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, controller.uploadMaterial);
router.delete('/:disciplineId/materials/:id', controller.deleteMaterial);

module.exports = router;
