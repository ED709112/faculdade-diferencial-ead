const express = require('express');
const router = express.Router();
const controller = require('../controllers/studentDocumentController');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');
const { createUpload } = require('../utils/upload');

const uploadStudentDoc = createUpload('student-docs', [
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp'
], 10 * 1024 * 1024);

router.get('/', authenticate, authorize('student'), controller.getMyDocuments);

router.post('/', authenticate, authorize('student'), (req, res, next) => {
  uploadStudentDoc.single('document')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Arquivo muito grande. Máximo 10MB.' });
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, controller.uploadStudentDoc);

router.delete('/:id', authenticate, authorize('student'), controller.deleteDocument);

module.exports = router;
