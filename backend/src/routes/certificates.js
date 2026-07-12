const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticate, authorize } = require('../middleware/auth');
const { paginationValidator } = require('../middleware/validators');

router.post('/generate', authenticate, certificateController.generate);

router.get('/my', authenticate, certificateController.getByUser);

router.get('/verify/:code', certificateController.verify);

router.get('/:id/download', authenticate, certificateController.download);

router.get('/', authenticate, authorize('admin'), paginationValidator, certificateController.getAll);

module.exports = router;
