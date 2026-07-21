const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { enrollmentValidators } = require('../middleware/validators');

router.post('/enroll-public', enrollmentController.enrollPublic);

router.get('/admin/all', authenticate, authorize('admin'), enrollmentController.getAllEnrollments);

router.put('/:id/confirm-payment', authenticate, authorize('admin'), enrollmentController.confirmPayment);

router.post('/:id/generate-boleto', authenticate, authorize('admin'), enrollmentController.generateBoleto);

router.get('/:id/payments', authenticate, authorize('admin'), enrollmentController.getPayments);

router.post('/:id/generate-installments', authenticate, authorize('admin'), enrollmentController.generateInstallments);

router.put('/payments/:paymentId/confirm', authenticate, authorize('admin'), enrollmentController.confirmPaymentById);

router.post('/', authenticate, enrollmentValidators.enroll, enrollmentController.enroll);

router.get('/my', authenticate, enrollmentController.getMyEnrollments);

router.get('/:id', authenticate, enrollmentController.getEnrollmentById);

router.get('/:id/course-progress', authenticate, enrollmentController.getCourseProgress);

router.get('/:enrollmentId/progress', authenticate, enrollmentController.getProgress);

router.put('/:enrollmentId/progress', authenticate, enrollmentController.updateProgress);

router.put('/:id/cancel', authenticate, authorize('admin'), enrollmentController.cancelEnrollment);

module.exports = router;
