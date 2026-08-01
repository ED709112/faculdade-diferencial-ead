const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const billing = require('../controllers/billingController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/campaigns', authenticate, authorize('admin'), billing.listCampaigns);
router.get('/stats', authenticate, authorize('admin'), billing.getStats);
router.get('/config', authenticate, authorize('admin'), billing.getConfig);
router.put('/config', authenticate, authorize('admin'), billing.updateConfig);
router.get('/', authenticate, authorize('admin'), billing.list);
router.post('/upload', authenticate, authorize('admin'), upload.single('file'), billing.upload);
router.post('/send-now', authenticate, authorize('admin'), billing.sendNow);
router.put('/records/:id', authenticate, authorize('admin'), billing.updateRecord);
router.delete('/records/:id', authenticate, authorize('admin'), billing.deleteRecord);
router.delete('/campaigns/:id', authenticate, authorize('admin'), billing.deleteCampaign);
router.get('/templates', authenticate, authorize('admin'), billing.getTemplates);
router.put('/templates', authenticate, authorize('admin'), billing.updateTemplates);

module.exports = router;
