const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const crm = require('../controllers/crmController');

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

module.exports = router;
