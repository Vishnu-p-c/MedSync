const express = require('express');
const router = express.Router();
const {forwardToChatbot} = require('../controllers/chatbotController');

// POST /app/chatbot - Forward user message to n8n chatbot
router.post('/chatbot', forwardToChatbot);

module.exports = router;
