const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/submissionController');
const { authenticate, authorize } = require('../middleware/auth');
const { createUpload } = require('../utils/upload');

const uploadSubmission = createUpload('student-submissions', [
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip', 'application/x-rar-compressed',
], 20 * 1024 * 1024);

// Student routes
router.get('/student', authenticate, authorize('student'), ctrl.getMySubmissions);
router.post('/student', authenticate, authorize('student'), (req, res, next) => {
  uploadSubmission.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Arquivo muito grande. Máximo 20MB.' });
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, ctrl.submitActivity);
router.delete('/student/:id', authenticate, authorize('student'), ctrl.deleteSubmission);

// Teacher routes
router.get('/teacher', authenticate, authorize('teacher'), ctrl.getTeacherSubmissions);
router.patch('/teacher/:id', authenticate, authorize('teacher'), ctrl.gradeSubmission);

// Gradebook (teacher)
router.get('/gradebook', authenticate, authorize('teacher'), ctrl.getGradebook);
router.post('/gradebook', authenticate, authorize('teacher'), ctrl.updateGradebook);
router.post('/gradebook/bulk', authenticate, authorize('teacher'), ctrl.updateGradebookBulk);

module.exports = router;
