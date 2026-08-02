const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const promo = require('../controllers/promoController');

router.get('/campaigns', authenticate, authorize('admin'), promo.list);
router.post('/campaigns', authenticate, authorize('admin'), promo.create);
router.get('/campaigns/:id', authenticate, authorize('admin'), promo.get);
router.put('/campaigns/:id', authenticate, authorize('admin'), promo.update);
router.delete('/campaigns/:id', authenticate, authorize('admin'), promo.remove);
router.post('/campaigns/:id/build', authenticate, authorize('admin'), promo.build);
router.get('/stats', authenticate, authorize('admin'), promo.stats);
router.get('/config', authenticate, authorize('admin'), promo.getConfig);
router.put('/config', authenticate, authorize('admin'), promo.updateConfig);
router.get('/records', authenticate, authorize('admin'), promo.records);
router.post('/records/:id/send-now', authenticate, authorize('admin'), promo.sendNow);

module.exports = router;
