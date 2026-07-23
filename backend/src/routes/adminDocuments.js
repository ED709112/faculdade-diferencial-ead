const express = require('express');
const router = express.Router();
const controller = require('../controllers/studentDocumentController');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');

router.use(authenticate, authorize('admin'), checkPermission('students'));

router.get('/', controller.getAllDocuments);
router.get('/stats', controller.getDocumentStats);
router.patch('/:id/review', controller.reviewDocument);

module.exports = router;
