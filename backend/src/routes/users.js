const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { userValidators, paginationValidator } = require('../middleware/validators');
const { uploadAvatar, uploadDocument } = require('../utils/upload');

router.get('/profile', authenticate, userController.getProfile);

router.put('/profile', authenticate, userValidators.updateProfile, userController.updateProfile);

router.put('/change-password', authenticate, userValidators.changePassword, userController.changePassword);

router.post('/avatar', authenticate, uploadAvatar.single('avatar'), userController.uploadAvatar);

router.post('/documents', authenticate, uploadDocument.single('document'), userController.uploadDocument);

router.get('/documents', authenticate, userController.getDocuments);

router.get('/', authenticate, authorize('admin'), paginationValidator, userController.getAll);

router.get('/:id', authenticate, authorize('admin'), userController.getById);

router.put('/:id', authenticate, authorize('admin'), userController.update);

router.put('/:id/toggle-active', authenticate, authorize('admin'), userController.toggleActive);

module.exports = router;
