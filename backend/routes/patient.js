const express = require('express');
const router = express.Router();
const {updatePatientFcmToken, startConversation, getPatientConversations} =
    require('../controllers/patientMessagingController');

// POST /patient/update-fcm-token - Update patient's FCM token
router.post('/update-fcm-token', updatePatientFcmToken);

// POST /patient/start-conversation - Patient initiates conversation with doctor
router.post('/start-conversation', startConversation);

// GET /patient/conversations/:patient_id - Get all conversations for a patient
router.get('/conversations/:patient_id', getPatientConversations);

module.exports = router;
