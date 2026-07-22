const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createUpload } = require('../utils/upload');
const newsController = require('../controllers/newsController');

const uploadNews = createUpload('news', [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif'
], 5 * 1024 * 1024);

// Rotas públicas
router.get('/public', newsController.listPublic);
router.get('/public/:slug', newsController.getBySlug);

// Rotas admin
router.get('/', authenticate, authorize('admin'), newsController.list);
router.get('/:id', authenticate, authorize('admin'), newsController.getById);
router.post('/', authenticate, authorize('admin'), uploadNews.single('image'), newsController.create);
router.put('/:id', authenticate, authorize('admin'), uploadNews.single('image'), newsController.update);
router.delete('/:id', authenticate, authorize('admin'), newsController.remove);

module.exports = router;
