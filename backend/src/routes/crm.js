const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const crm = require('../controllers/crmController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Stats
router.get('/stats', authenticate, authorize('admin'), crm.getStats);

// Leads CRUD
router.get('/leads', authenticate, authorize('admin'), crm.listLeads);
router.get('/leads/:id', authenticate, authorize('admin'), crm.getLead);
router.post('/leads', authenticate, authorize('admin'), crm.createLead);
router.put('/leads/:id', authenticate, authorize('admin'), crm.updateLead);
router.delete('/leads/:id', authenticate, authorize('admin'), crm.deleteLead);
router.patch('/leads/:id/move', authenticate, authorize('admin'), crm.moveLead);

// Interactions
router.post('/leads/:id/interactions', authenticate, authorize('admin'), crm.addInteraction);

// Tags
router.get('/tags', authenticate, authorize('admin'), crm.listTags);
router.post('/tags', authenticate, authorize('admin'), crm.createTag);
router.delete('/tags/:id', authenticate, authorize('admin'), crm.deleteTag);

// Exportação
router.get('/export', authenticate, authorize('admin'), crm.exportLeads);

// Importação em lote
router.post('/import', authenticate, authorize('admin'), upload.single('file'), crm.importLeads);

// Respostas rápidas
router.get('/quick-responses', authenticate, authorize('admin'), crm.listQuickResponses);
router.post('/quick-responses', authenticate, authorize('admin'), crm.createQuickResponse);
router.put('/quick-responses/:id', authenticate, authorize('admin'), crm.updateQuickResponse);
router.delete('/quick-responses/:id', authenticate, authorize('admin'), crm.deleteQuickResponse);

// Lembretes
router.get('/reminders', authenticate, authorize('admin'), crm.listReminders);
router.post('/reminders', authenticate, authorize('admin'), crm.createReminder);
router.put('/reminders/:id', authenticate, authorize('admin'), crm.updateReminder);
router.delete('/reminders/:id', authenticate, authorize('admin'), crm.deleteReminder);

// Regras de follow up
router.get('/follow-up-rules', authenticate, authorize('admin'), crm.listFollowUpRules);
router.post('/follow-up-rules', authenticate, authorize('admin'), crm.createFollowUpRule);
router.put('/follow-up-rules/:id', authenticate, authorize('admin'), crm.updateFollowUpRule);
router.delete('/follow-up-rules/:id', authenticate, authorize('admin'), crm.deleteFollowUpRule);

// Webhooks
router.get('/webhooks', authenticate, authorize('admin'), crm.listWebhooks);
router.post('/webhooks', authenticate, authorize('admin'), crm.createWebhook);
router.put('/webhooks/:id', authenticate, authorize('admin'), crm.updateWebhook);
router.delete('/webhooks/:id', authenticate, authorize('admin'), crm.deleteWebhook);
router.post('/webhooks/test', authenticate, authorize('admin'), crm.testWebhook);
router.get('/webhook-logs', authenticate, authorize('admin'), crm.listWebhookLogs);

// Equipe
router.get('/team', authenticate, authorize('admin'), crm.listTeam);

// Backups
router.get('/backups', authenticate, authorize('admin'), crm.listBackups);
router.post('/backups/run', authenticate, authorize('admin'), crm.runBackupNow);

// Public (no auth)
router.post('/public-leads', crm.publicCreateLead);
router.get('/qrcode', crm.generateQRCode);

module.exports = router;
