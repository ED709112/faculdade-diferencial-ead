const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/ranking', authenticate, badgeController.getRanking);

router.get('/my', authenticate, badgeController.getUserBadges);

router.get('/', authenticate, badgeController.getAll);

router.post('/award', authenticate, authorize('admin', 'teacher'), badgeController.awardBadge);

router.post('/points', authenticate, authorize('admin'), badgeController.addPoints);

router.get('/admin/all', authenticate, authorize('admin'), badgeController.getAllAdmin);

router.post('/admin', authenticate, authorize('admin'), badgeController.createBadge);

router.put('/:id', authenticate, authorize('admin'), badgeController.updateBadge);

router.delete('/:id', authenticate, authorize('admin'), badgeController.deleteBadge);

module.exports = router;
