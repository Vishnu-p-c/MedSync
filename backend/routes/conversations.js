const express = require('express');
const router = express.Router();
const {getConversationMessagesPaginated} =
    require('../controllers/patientMessagingController');

// GET /conversations/:conversation_id/messages - Get paginated messages
// Query params: user_id, page, limit
router.get('/:conversation_id/messages', getConversationMessagesPaginated);

module.exports = router;
