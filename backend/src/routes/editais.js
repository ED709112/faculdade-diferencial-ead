const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createUpload } = require('../utils/upload');
const editalController = require('../controllers/editalController');

const uploadEditais = createUpload('editais', [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp'
], 20 * 1024 * 1024);

// Rotas públicas
router.get('/public', editalController.listPublic);

// Rotas admin
router.get('/', authenticate, authorize('admin'), editalController.list);
router.get('/:id', authenticate, authorize('admin'), editalController.getById);
router.post('/', authenticate, authorize('admin'), uploadEditais.single('file'), editalController.create);
router.put('/:id', authenticate, authorize('admin'), uploadEditais.single('file'), editalController.update);
router.delete('/:id', authenticate, authorize('admin'), editalController.remove);

module.exports = router;
