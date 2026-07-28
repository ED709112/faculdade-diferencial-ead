const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const chatbot = require('../controllers/chatbotController');

// Webhook (público - recebe do WhatsApp/Evolution API)
router.post('/webhook', chatbot.webhook);

// Config
router.get('/config', authenticate, authorize('admin'), chatbot.getConfig);
router.put('/config', authenticate, authorize('admin'), chatbot.updateConfig);

// Conversations
router.get('/conversations', authenticate, authorize('admin'), chatbot.listConversations);
router.get('/conversations/:id', authenticate, authorize('admin'), chatbot.getConversation);
router.put('/conversations/:id', authenticate, authorize('admin'), chatbot.updateConversation);

// Messages
router.post('/messages', authenticate, authorize('admin'), chatbot.sendMessage);

// Stats
router.get('/stats', authenticate, authorize('admin'), chatbot.getStats);

// WhatsApp
router.get('/whatsapp/status', authenticate, authorize('admin'), chatbot.whatsappStatus);
router.get('/whatsapp/qr', authenticate, authorize('admin'), chatbot.whatsappQR);

// Test AI
router.post('/test-ai', authenticate, authorize('admin'), chatbot.testAI);

module.exports = router;
