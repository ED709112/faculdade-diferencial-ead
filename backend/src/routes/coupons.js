const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticate, authorize } = require('../middleware/auth');
const { paginationValidator } = require('../middleware/validators');

router.post('/validate', authenticate, couponController.validate);

router.get('/', authenticate, authorize('admin'), paginationValidator, couponController.getAll);

router.post('/', authenticate, authorize('admin'), couponController.create);

router.put('/:id', authenticate, authorize('admin'), couponController.update);

router.delete('/:id', authenticate, authorize('admin'), couponController.delete);

module.exports = router;
