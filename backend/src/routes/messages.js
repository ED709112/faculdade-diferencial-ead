const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');
const { paginationValidator } = require('../middleware/validators');

router.get('/conversations', authenticate, messageController.getConversations);

router.get('/:conversationId', authenticate, paginationValidator, messageController.getMessages);

router.post('/', authenticate, messageController.sendMessage);

router.post('/conversation', authenticate, messageController.createConversation);

router.put('/:conversationId/read', authenticate, messageController.markAsRead);

module.exports = router;
