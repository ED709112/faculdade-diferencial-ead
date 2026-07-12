const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { paginationValidator } = require('../middleware/validators');

router.use(authenticate, authorize('admin'));

router.get('/dashboard', adminController.getDashboardStats);

router.get('/revenue-chart', adminController.getRevenueChart);

router.get('/recent-activity', adminController.getRecentActivity);

router.get('/users', paginationValidator, adminController.getAllUsers);

router.get('/courses-stats', adminController.getCoursesStats);

router.get('/financial-report', adminController.getFinancialReport);

router.get('/reports', adminController.getReports);

module.exports = router;
