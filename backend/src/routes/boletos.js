const express = require('express');
const router = express.Router();
const boletoController = require('../controllers/boletoController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/admin/plans', authenticate, authorize('admin'), boletoController.listPlans);

router.post('/admin/plans', authenticate, authorize('admin'), boletoController.createPlan);

router.get('/admin', authenticate, authorize('admin'), boletoController.listBoletos);

router.post('/admin/:id/confirm', authenticate, authorize('admin'), boletoController.confirmPayment);

router.post('/admin/:id/cancel', authenticate, authorize('admin'), boletoController.cancelBoleto);

router.post('/admin/:id/retry', authenticate, authorize('admin'), boletoController.retryBoleto);

router.get('/student', authenticate, authorize('student'), boletoController.listMyBoletos);

module.exports = router;
