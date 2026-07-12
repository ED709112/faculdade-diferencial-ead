const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

router.post('/process', authenticate, paymentController.processPayment);

router.post('/pix', authenticate, paymentController.generatePix);

router.post('/boleto', authenticate, paymentController.generateBoleto);

router.post('/credit-card', authenticate, paymentController.processCreditCard);

router.post('/webhook', paymentController.handleWebhook);

router.get('/status/:orderId', authenticate, paymentController.checkPaymentStatus);

module.exports = router;
