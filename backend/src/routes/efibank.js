const express = require('express');
const router = express.Router();
const efibankController = require('../controllers/efibankPaymentController');
const { authenticate } = require('../middleware/auth');

router.post('/pix', authenticate, efibankController.generatePix);

router.post('/boleto', authenticate, efibankController.generateBoleto);

router.post('/credit-card', authenticate, efibankController.processCreditCard);

router.post('/webhook', efibankController.handleWebhook);

router.get('/status/:orderId', authenticate, efibankController.checkPaymentStatus);

module.exports = router;
