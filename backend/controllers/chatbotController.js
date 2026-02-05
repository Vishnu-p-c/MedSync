const User = require('../models/User');
const axios = require('axios');

// POST /app/chatbot - Forward user message to n8n chatbot
const forwardToChatbot = async (req, res) => {
  try {
    const {user_id, message} = req.body;

    // Step 1: Validate required fields
    if (!user_id || !message) {
      const missing = [];
      if (!user_id) missing.push('user_id');
      if (!message) missing.push('message');
      return res.status(400).json(
          {status: 'fail', message: 'missing_fields', missing: missing});
    }

    // Step 2: Verify user exists
    const user = await User.findOne({user_id: user_id});
    if (!user) {
      return res.status(403).json({status: 'fail', message: 'user_not_found'});
    }

    // Step 3: Get n8n webhook URL from environment
    const n8nWebhookUrl = process.env.N8N_CHATBOT_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      console.error('N8N_CHATBOT_WEBHOOK_URL not configured');
      return res.status(500).json(
          {status: 'error', message: 'chatbot_service_not_configured'});
    }

    // Step 4: Forward request to n8n
    try {
      const n8nResponse = await axios.post(
          n8nWebhookUrl, {user_id: user_id, message: message}, {
            headers: {'Content-Type': 'application/json'},
            timeout: 30000  // 30 second timeout
          });

      // Step 5: Return n8n response to client
      return res.json({
        status: 'success',
        reply: n8nResponse.data.reply || '',
        category: n8nResponse.data.category || '',
        confidence: n8nResponse.data.confidence || ''
      });

    } catch (n8nError) {
      console.error('n8n webhook error:', n8nError.message);

      // Handle n8n service errors
      if (n8nError.response) {
        // n8n returned an error response
        return res.status(502).json({
          status: 'error',
          message: 'chatbot_service_error',
          details: n8nError.response.data
        });
      } else if (n8nError.request) {
        // Request was made but no response received
        return res.status(504).json(
            {status: 'error', message: 'chatbot_service_timeout'});
      } else {
        // Something else went wrong
        return res.status(500).json(
            {status: 'error', message: 'chatbot_request_failed'});
      }
    }

  } catch (error) {
    console.error('Chatbot controller error:', error);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
};

module.exports = {forwardToChatbot};
