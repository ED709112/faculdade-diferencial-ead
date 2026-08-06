const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const productController = require('../controllers/productController');
const { uploadProductImage, uploadProductDownload } = require('../utils/upload');

router.get('/', productController.getAllPublic);
router.get('/categories', productController.getCategories);
router.get('/categories/all', authenticate, authorize('admin'), productController.getAllCategories);
router.get('/my', authenticate, productController.getMyProducts);
router.get('/admin/all', authenticate, authorize('admin'), productController.getAllAdmin);
router.get('/:slug', productController.getBySlug);
router.post('/', authenticate, authorize('admin'), productController.create);
router.put('/:id', authenticate, authorize('admin'), productController.update);
router.post('/:id/image', authenticate, authorize('admin'), uploadProductImage.single('image'), productController.uploadImage);
router.post('/:id/download-file', authenticate, authorize('admin'), uploadProductDownload.single('file'), productController.uploadDownload);
router.get('/:id/download', authenticate, productController.getDownload);
router.delete('/:id', authenticate, authorize('admin'), productController.remove);

module.exports = router;
