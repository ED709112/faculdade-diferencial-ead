const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', faqController.getAll);

router.post('/', authenticate, authorize('admin'), faqController.create);

router.put('/:id', authenticate, authorize('admin'), faqController.update);

router.delete('/:id', authenticate, authorize('admin'), faqController.delete);

module.exports = router;
