const express = require('express');
const router = express.Router();
const historicoController = require('../controllers/historicoController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('student'), historicoController.getMyHistorico);

router.get('/pdf', authenticate, authorize('student'), historicoController.downloadHistoricoPdf);

router.get('/admin/:userId', authenticate, authorize('admin'), historicoController.getStudentHistorico);

router.get('/admin/:userId/pdf', authenticate, authorize('admin'), historicoController.downloadHistoricoPdf);

module.exports = router;
