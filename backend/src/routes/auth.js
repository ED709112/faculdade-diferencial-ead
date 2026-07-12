const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authValidators } = require('../middleware/validators');

router.post('/register', authValidators.register, authController.register);

router.post('/login', authValidators.login, authController.login);

router.post('/verify-email', authController.verifyEmail);

router.post('/forgot-password', authValidators.forgotPassword, authController.forgotPassword);

router.post('/reset-password', authValidators.resetPassword, authController.resetPassword);

router.post('/logout', authenticate, authController.logout);

router.post('/refresh-token', authController.refreshToken);

module.exports = router;
