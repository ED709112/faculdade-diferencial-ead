const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const { paginationValidator } = require('../middleware/validators');

router.post('/', authenticate, orderController.create);

router.get('/my', authenticate, orderController.getMyOrders);

router.get('/', authenticate, authorize('admin'), paginationValidator, orderController.getAll);

router.get('/user/:userId', authenticate, authorize('admin'), orderController.getByUser);

router.get('/:id', authenticate, authorize('admin'), orderController.getById);

router.put('/:id/status', authenticate, authorize('admin'), orderController.updateStatus);

module.exports = router;
