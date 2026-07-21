const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const productController = require('../controllers/productController');
const { uploadProductImage } = require('../utils/upload');

router.get('/', productController.getAllPublic);
router.get('/categories', productController.getCategories);
router.get('/admin/all', authenticate, authorize('admin'), productController.getAllAdmin);
router.get('/:slug', productController.getBySlug);
router.post('/', authenticate, authorize('admin'), productController.create);
router.put('/:id', authenticate, authorize('admin'), productController.update);
router.post('/:id/image', authenticate, authorize('admin'), uploadProductImage.single('image'), productController.uploadImage);
router.delete('/:id', authenticate, authorize('admin'), productController.remove);

module.exports = router;
