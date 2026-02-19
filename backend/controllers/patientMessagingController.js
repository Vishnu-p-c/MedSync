const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const admin = require('../config/firebase');

// Helper function to send FCM notification
const sendFCMNotification = async (fcmToken, title, body, data) => {
  try {
    const message = {
      notification: {title, body},
      data: data,
      token: fcmToken,
      android: {priority: 'high', notification: {priority: 'max'}}
    };

    const response = await admin.messaging().send(message);
    console.log('FCM notification sent successfully:', response);
    return {success: true, response};
  } catch (error) {
    console.error('FCM notification error:', error);
    return {success: false, error: error.message};
  }
};

// Helper to clear invalid FCM token
const clearInvalidToken = async (model, idField, idValue) => {
  try {
    const updateObj = {$set: {fcm_token: null, token_last_update: null}};
    await model.updateOne({[idField]: idValue}, updateObj);
    console.log(`Cleared invalid FCM token for ${idField}: ${idValue}`);
  } catch (err) {
    console.error('Error clearing invalid token:', err);
  }
};

// POST /patient/update-fcm-token - Update patient's FCM token
const updatePatientFcmToken = async (req, res) => {
  try {
    const {patient_id, fcm_token} = req.body;

    // Validate required fields
    if (!patient_id || !fcm_token) {
      return res.json({
        status: 'fail',
        message: 'missing_fields',
        missing: [
          !patient_id && 'patient_id', !fcm_token && 'fcm_token'
        ].filter(Boolean)
      });
    }

    const patientIdNum = parseInt(patient_id);
    if (isNaN(patientIdNum)) {
      return res.json({status: 'fail', message: 'patient_id_must_be_number'});
    }

    // Verify patient exists
    const patient =
        await User.findOne({user_id: patientIdNum, role: 'patient'});
    if (!patient) {
      return res.json({status: 'fail', message: 'patient_not_found'});
    }

    // Update FCM token
    patient.fcm_token = fcm_token;
    patient.token_last_update = new Date();
    await patient.save();

    return res.json({
      status: 'success',
      message: 'fcm_token_updated',
      patient_id: patientIdNum,
      token_last_update: patient.token_last_update
    });

  } catch (error) {
    console.error('Update patient FCM token error:', error);
    return res.json({status: 'error', message: 'server_error'});
  }
};

// POST /patient/start-conversation - Patient initiates conversation with doctor
const startConversation = async (req, res) => {
  try {
    const {patient_id, doctor_id, message} = req.body;

    // Validate required fields
    if (!patient_id || !doctor_id || !message) {
      return res.json({
        status: 'fail',
        message: 'missing_fields',
        missing: [
          !patient_id && 'patient_id', !doctor_id && 'doctor_id',
          !message && 'message'
        ].filter(Boolean)
      });
    }

    const patientIdNum = parseInt(patient_id);
    const doctorIdNum = parseInt(doctor_id);

    if (isNaN(patientIdNum)) {
      return res.json({status: 'fail', message: 'patient_id_must_be_number'});
    }
    if (isNaN(doctorIdNum)) {
      return res.json({status: 'fail', message: 'doctor_id_must_be_number'});
    }

    // Verify patient exists
    const patient =
        await User.findOne({user_id: patientIdNum, role: 'patient'}).lean();
    if (!patient) {
      return res.json({status: 'fail', message: 'patient_not_found'});
    }

    // Verify doctor exists
    const doctor = await Doctor.findOne({doctor_id: doctorIdNum}).lean();
    if (!doctor) {
      return res.json({status: 'fail', message: 'doctor_not_found'});
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      type: 'patient_doctor',
      doctor_id: doctorIdNum,
      patient_id: patientIdNum,
      is_active: true
    });

    const now = new Date();
    let conversationCreated = false;

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        type: 'patient_doctor',
        participants: [
          {user_id: patientIdNum, role: 'patient'},
          {user_id: doctorIdNum, role: 'doctor'}
        ],
        created_by: patientIdNum,
        doctor_id: doctorIdNum,
        patient_id: patientIdNum,
        hospital_id: null,
        last_message: message.substring(0, 500),
        last_message_sender: patientIdNum,
        last_message_at: now,
        unread_count: {doctor: 1, patient: 0, hospital: 0},
        is_active: true,
        created_at: now,
        updated_at: now
      });
      await conversation.save();
      conversationCreated = true;
    } else {
      // Update existing conversation
      conversation.last_message = message.substring(0, 500);
      conversation.last_message_sender = patientIdNum;
      conversation.last_message_at = now;
      conversation.unread_count.doctor =
          (conversation.unread_count.doctor || 0) + 1;
      conversation.updated_at = now;
      await conversation.save();
    }

    // Insert message
    const newMessage = new Message({
      conversation_id: conversation._id,
      sender_id: patientIdNum,
      sender_role: 'patient',
      receiver_id: doctorIdNum,
      receiver_role: 'doctor',
      message_type: 'text',
      content: message,
      is_read: false,
      read_at: null,
      created_at: now
    });
    await newMessage.save();

    // Send FCM to doctor
    let fcmResult = {success: false, message: 'no_fcm_token'};
    if (doctor.fcm_token) {
      const patientName =
          `${patient.first_name} ${patient.last_name || ''}`.trim();
      fcmResult = await sendFCMNotification(
          doctor.fcm_token, 'New Patient Message',
          `You have a new message from ${patientName}`, {
            type: 'patient_message',
            conversation_id: conversation._id.toString(),
            patient_id: patientIdNum.toString(),
            doctor_id: doctorIdNum.toString(),
            patient_name: patientName
          });

      // Clear invalid token
      if (!fcmResult.success &&
          (fcmResult.error?.includes(
               'messaging/registration-token-not-registered') ||
           fcmResult.error?.includes('messaging/invalid-registration-token'))) {
        await clearInvalidToken(Doctor, 'doctor_id', doctorIdNum);
      }
    }

    return res.json({
      status: 'success',
      message: conversationCreated ? 'conversation_created' : 'message_sent',
      conversation_id: conversation._id.toString(),
      message_id: newMessage._id.toString(),
      fcm_sent: fcmResult.success
    });

  } catch (error) {
    console.error('Start conversation error:', error);
    return res.json({status: 'error', message: 'server_error'});
  }
};

// POST /doctor/reply-message - Doctor replies to patient conversation
const doctorReplyMessage = async (req, res) => {
  try {
    const {doctor_id, conversation_id, message} = req.body;

    // Validate required fields
    if (!doctor_id || !conversation_id || !message) {
      return res.json({
        status: 'fail',
        message: 'missing_fields',
        missing: [
          !doctor_id && 'doctor_id', !conversation_id && 'conversation_id',
          !message && 'message'
        ].filter(Boolean)
      });
    }

    const doctorIdNum = parseInt(doctor_id);
    if (isNaN(doctorIdNum)) {
      return res.json({status: 'fail', message: 'doctor_id_must_be_number'});
    }

    // Verify conversation exists
    const conversation = await Conversation.findById(conversation_id);
    if (!conversation) {
      return res.json({status: 'fail', message: 'conversation_not_found'});
    }

    // Validate conversation type
    if (conversation.type !== 'patient_doctor') {
      return res.json({
        status: 'fail',
        message: 'invalid_conversation_type',
        expected: 'patient_doctor'
      });
    }

    // Validate doctor owns this conversation
    if (conversation.doctor_id !== doctorIdNum) {
      return res.json({status: 'fail', message: 'doctor_not_in_conversation'});
    }

    const patientIdNum = conversation.patient_id;

    // Get patient for FCM
    const patient =
        await User.findOne({user_id: patientIdNum, role: 'patient'}).lean();
    if (!patient) {
      return res.json({status: 'fail', message: 'patient_not_found'});
    }

    // Get doctor for name
    const doctor = await Doctor.findOne({doctor_id: doctorIdNum}).lean();
    if (!doctor) {
      return res.json({status: 'fail', message: 'doctor_not_found'});
    }

    const now = new Date();

    // Insert message
    const newMessage = new Message({
      conversation_id: conversation._id,
      sender_id: doctorIdNum,
      sender_role: 'doctor',
      receiver_id: patientIdNum,
      receiver_role: 'patient',
      message_type: 'text',
      content: message,
      is_read: false,
      read_at: null,
      created_at: now
    });
    await newMessage.save();

    // Update conversation
    conversation.last_message = message.substring(0, 500);
    conversation.last_message_sender = doctorIdNum;
    conversation.last_message_at = now;
    conversation.unread_count.patient =
        (conversation.unread_count.patient || 0) + 1;
    conversation.updated_at = now;
    await conversation.save();

    // Send FCM to patient
    let fcmResult = {success: false, message: 'no_fcm_token'};
    if (patient.fcm_token) {
      const doctorName =
          `Dr. ${doctor.first_name} ${doctor.last_name || ''}`.trim();
      fcmResult = await sendFCMNotification(
          patient.fcm_token, 'Doctor Reply',
          `You have a new reply from ${doctorName}`, {
            type: 'doctor_reply',
            conversation_id: conversation._id.toString(),
            doctor_id: doctorIdNum.toString(),
            patient_id: patientIdNum.toString(),
            doctor_name: doctorName
          });

      // Clear invalid token
      if (!fcmResult.success &&
          (fcmResult.error?.includes(
               'messaging/registration-token-not-registered') ||
           fcmResult.error?.includes('messaging/invalid-registration-token'))) {
        await clearInvalidToken(User, 'user_id', patientIdNum);
      }
    }

    return res.json({
      status: 'success',
      message: 'reply_sent',
      conversation_id: conversation._id.toString(),
      message_id: newMessage._id.toString(),
      fcm_sent: fcmResult.success
    });

  } catch (error) {
    console.error('Doctor reply message error:', error);
    return res.json({status: 'error', message: 'server_error'});
  }
};

// GET /patient/conversations/:patient_id - Get all conversations for a patient
const getPatientConversations = async (req, res) => {
  try {
    const {patient_id} = req.params;

    if (!patient_id) {
      return res.json({status: 'fail', message: 'missing_field: patient_id'});
    }

    const patientIdNum = parseInt(patient_id);
    if (isNaN(patientIdNum)) {
      return res.json({status: 'fail', message: 'patient_id_must_be_number'});
    }

    // Verify patient exists
    const patient =
        await User.findOne({user_id: patientIdNum, role: 'patient'}).lean();
    if (!patient) {
      return res.json({status: 'fail', message: 'patient_not_found'});
    }

    // Fetch conversations
    const conversations = await Conversation
                              .find({
                                type: 'patient_doctor',
                                patient_id: patientIdNum,
                                is_active: true
                              })
                              .sort({last_message_at: -1})
                              .lean();

    // Enrich with doctor names
    const doctorIds = [...new Set(conversations.map(c => c.doctor_id))];
    const doctors = await Doctor.find({doctor_id: {$in: doctorIds}})
                        .select('doctor_id first_name last_name department')
                        .lean();

    const doctorMap = {};
    doctors.forEach(d => {
      doctorMap[d.doctor_id] = {
        name: `Dr. ${d.first_name} ${d.last_name || ''}`.trim(),
        department: d.department
      };
    });

    const enrichedConversations = conversations.map(
        conv => ({
          conversation_id: conv._id.toString(),
          type: conv.type,
          doctor_id: conv.doctor_id,
          doctor_name: doctorMap[conv.doctor_id]?.name || 'Unknown Doctor',
          doctor_department: doctorMap[conv.doctor_id]?.department || '',
          last_message: conv.last_message || '',
          last_message_at: conv.last_message_at,
          unread_count: conv.unread_count?.patient || 0,
          created_at: conv.created_at
        }));

    return res.json({
      status: 'success',
      patient_id: patientIdNum,
      total_conversations: enrichedConversations.length,
      conversations: enrichedConversations
    });

  } catch (error) {
    console.error('Get patient conversations error:', error);
    return res.json({status: 'error', message: 'server_error'});
  }
};

// GET /conversations/:conversation_id/messages - Get paginated messages
const getConversationMessagesPaginated = async (req, res) => {
  try {
    const {conversation_id} = req.params;
    const {user_id, page = 1, limit = 20} = req.query;

    if (!conversation_id) {
      return res.json(
          {status: 'fail', message: 'missing_field: conversation_id'});
    }

    if (!user_id) {
      return res.json({status: 'fail', message: 'missing_field: user_id'});
    }

    const userIdNum = parseInt(user_id);
    if (isNaN(userIdNum)) {
      return res.json({status: 'fail', message: 'user_id_must_be_number'});
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Verify conversation exists
    const conversation = await Conversation.findById(conversation_id).lean();
    if (!conversation) {
      return res.json({status: 'fail', message: 'conversation_not_found'});
    }

    // Verify user is participant
    const isParticipant = conversation.doctor_id === userIdNum ||
        conversation.patient_id === userIdNum ||
        conversation.hospital_id === userIdNum;

    if (!isParticipant) {
      return res.json(
          {status: 'fail', message: 'not_conversation_participant'});
    }

    // Get total count
    const totalMessages =
        await Message.countDocuments({conversation_id: conversation_id});

    // Fetch paginated messages (sorted by created_at DESC for pagination)
    const messages = await Message.find({conversation_id: conversation_id})
                         .sort({created_at: -1})
                         .skip(skip)
                         .limit(limitNum)
                         .lean();

    // Get sender names
    const senderIds = [...new Set(messages.map(m => m.sender_id))];

    // Fetch doctors and users
    const doctorSenders = await Doctor.find({doctor_id: {$in: senderIds}})
                              .select('doctor_id first_name last_name')
                              .lean();
    const userSenders = await User.find({user_id: {$in: senderIds}})
                            .select('user_id first_name last_name')
                            .lean();

    const nameMap = {};
    doctorSenders.forEach(d => {
      nameMap[`doctor_${d.doctor_id}`] =
          `Dr. ${d.first_name} ${d.last_name || ''}`.trim();
    });
    userSenders.forEach(u => {
      nameMap[`patient_${u.user_id}`] =
          `${u.first_name} ${u.last_name || ''}`.trim();
      nameMap[`hospital_${u.user_id}`] = u.first_name;
    });

    // Format messages
    const formattedMessages = messages.map(msg => {
      let senderName = 'Unknown';
      const key = `${msg.sender_role}_${msg.sender_id}`;
      if (nameMap[key]) {
        senderName = nameMap[key];
      }

      return {
        message_id: msg._id.toString(),
        conversation_id: conversation_id,
        sender_id: String(msg.sender_id),
        sender_type: msg.sender_role,
        sender_name: senderName,
        message: msg.content || '',
        timestamp: msg.created_at,
        is_read: msg.is_read || false
      };
    });

    const totalPages = Math.ceil(totalMessages / limitNum);

    return res.json({
      status: 'success',
      conversation_id: conversation_id,
      page: pageNum,
      limit: limitNum,
      total_messages: totalMessages,
      total_pages: totalPages,
      has_next: pageNum < totalPages,
      has_prev: pageNum > 1,
      messages: formattedMessages
    });

  } catch (error) {
    console.error('Get conversation messages paginated error:', error);
    return res.json({status: 'error', message: 'server_error'});
  }
};

module.exports = {
  updatePatientFcmToken,
  startConversation,
  doctorReplyMessage,
  getPatientConversations,
  getConversationMessagesPaginated
};
