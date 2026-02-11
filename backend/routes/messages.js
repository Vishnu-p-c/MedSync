const express = require('express');
const router = express.Router();
const {getConversationMessages, markMessagesAsRead} =
    require('../controllers/doctorMessagingController');

// Get all messages in a conversation
// GET /messages/:conversation_id?doctor_id=23
router.get('/:conversation_id', getConversationMessages);

// Mark messages as read in a conversation
// POST /messages/mark-read
router.post('/mark-read', markMessagesAsRead);

module.exports = router;
