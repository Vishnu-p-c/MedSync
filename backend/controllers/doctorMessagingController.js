const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// GET /doctor/conversations - Get all conversations for a doctor
const getDoctorConversations = async (req, res) => {
  try {
    const {doctor_id, type} = req.query;

    // Validate doctor_id
    if (!doctor_id) {
      return res.json({status: 'fail', message: 'missing_field: doctor_id'});
    }

    const doctorIdNum = parseInt(doctor_id);
    if (isNaN(doctorIdNum)) {
      return res.json({status: 'fail', message: 'doctor_id_must_be_number'});
    }

    // Verify doctor exists
    const doctor = await Doctor.findOne({doctor_id: doctorIdNum}).lean();
    if (!doctor) {
      return res.json({status: 'fail', message: 'doctor_not_found'});
    }

    // Build query
    const query = {doctor_id: doctorIdNum, is_active: true};
    if (type) {
      query.type = type;
    }

    // Fetch conversations
    const conversations =
        await Conversation.find(query).sort({last_message_at: -1}).lean();

    // Collect IDs for batch lookup
    const hospitalIds = [...new Set(
        conversations.filter(c => c.hospital_id).map(c => c.hospital_id))];
    const patientIds = [...new Set(
        conversations.filter(c => c.patient_id).map(c => c.patient_id))];

    // Batch fetch hospitals and patients
    const hospitals = await Hospital.find({hospital_id: {$in: hospitalIds}})
                          .select('hospital_id name')
                          .lean();
    const patients = await User.find({user_id: {$in: patientIds}})
                         .select('user_id first_name last_name')
                         .lean();

    // Create lookup maps
    const hospitalMap = {};
    hospitals.forEach(h => {
      hospitalMap[h.hospital_id] = h.name;
    });

    const patientMap = {};
    patients.forEach(p => {
      patientMap[p.user_id] = `${p.first_name} ${p.last_name || ''}`.trim();
    });

    // Enrich conversations
    const enrichedConversations = conversations.map(conv => {
      const base = {
        conversation_id: conv._id.toString(),
        type: conv.type,
        last_message: conv.last_message || '',
        last_message_at: conv.last_message_at,
        unread_count: conv.unread_count?.doctor || 0,
        created_at: conv.created_at
      };

      if (conv.type === 'hospital_doctor') {
        base.hospital_id = conv.hospital_id;
        base.hospital_name =
            hospitalMap[conv.hospital_id] || 'Unknown Hospital';
      } else if (conv.type === 'patient_doctor') {
        base.patient_id = conv.patient_id;
        base.patient_name = patientMap[conv.patient_id] || 'Unknown Patient';
      }

      return base;
    });

    return res.json({
      status: 'success',
      doctor_id: doctorIdNum,
      total_conversations: enrichedConversations.length,
      conversations: enrichedConversations
    });

  } catch (error) {
    console.error('Get doctor conversations error:', error);
    return res.json({status: 'error', message: 'server_error'});
  }
};

// GET /messages/:conversation_id - Get all messages in a conversation
const getConversationMessages = async (req, res) => {
  try {
    const {conversation_id} = req.params;
    const {doctor_id} = req.query;

    // Validate required fields
    if (!conversation_id) {
      return res.json(
          {status: 'fail', message: 'missing_field: conversation_id'});
    }

    if (!doctor_id) {
      return res.json({status: 'fail', message: 'missing_field: doctor_id'});
    }

    const doctorIdNum = parseInt(doctor_id);
    if (isNaN(doctorIdNum)) {
      return res.json({status: 'fail', message: 'doctor_id_must_be_number'});
    }

    // Verify conversation exists and doctor is a participant
    const conversation = await Conversation.findById(conversation_id).lean();
    if (!conversation) {
      return res.json({status: 'fail', message: 'conversation_not_found'});
    }

    if (conversation.doctor_id !== doctorIdNum) {
      return res.json(
          {status: 'fail', message: 'not_conversation_participant'});
    }

    // Fetch messages
    const messages = await Message.find({conversation_id: conversation_id})
                         .sort({created_at: 1})
                         .lean();

    // Get sender names (hospitals, doctors, and patients)
    const hospitalIds =
        [...new Set(messages.filter(m => m.sender_role === 'hospital')
                        .map(m => m.sender_id))];
    const doctorIds =
        [...new Set(messages.filter(m => m.sender_role === 'doctor')
                        .map(m => m.sender_id))];
    const patientIds =
        [...new Set(messages.filter(m => m.sender_role === 'patient')
                        .map(m => m.sender_id))];

    const hospitals = await Hospital.find({hospital_id: {$in: hospitalIds}})
                          .select('hospital_id name')
                          .lean();
    const doctors = await Doctor.find({doctor_id: {$in: doctorIds}})
                        .select('doctor_id first_name last_name')
                        .lean();
    const patients = await User.find({user_id: {$in: patientIds}})
                         .select('user_id first_name last_name')
                         .lean();

    // Create lookup maps
    const hospitalMap = {};
    hospitals.forEach(h => {
      hospitalMap[h.hospital_id] = h.name;
    });

    const doctorMap = {};
    doctors.forEach(d => {
      doctorMap[d.doctor_id] =
          `Dr. ${d.first_name} ${d.last_name || ''}`.trim();
    });

    const patientMap = {};
    patients.forEach(p => {
      patientMap[p.user_id] = `${p.first_name} ${p.last_name || ''}`.trim();
    });

    // Format messages for Android app
    const formattedMessages = messages.map(msg => {
      let senderName = 'Unknown';
      if (msg.sender_role === 'hospital') {
        senderName = hospitalMap[msg.sender_id] || 'Unknown Hospital';
      } else if (msg.sender_role === 'doctor') {
        senderName = doctorMap[msg.sender_id] || 'Unknown Doctor';
      } else if (msg.sender_role === 'patient') {
        senderName = patientMap[msg.sender_id] || 'Unknown Patient';
      }

      return {
        message_id: msg._id.toString(),
        conversation_id: conversation_id,
        sender_id: String(msg.sender_id),
        sender_type: msg.sender_role,  // "hospital", "doctor", or "patient"
        sender_name: senderName,
        message: msg.content || '',  // Android expects "message" field
        timestamp: msg.created_at,   // ISO 8601 format
        is_read: msg.is_read || false
      };
    });

    return res.json({
      status: 'success',
      conversation_id: conversation_id,
      total_messages: formattedMessages.length,
      messages: formattedMessages
    });

  } catch (error) {
    console.error('Get conversation messages error:', error);
    return res.json({status: 'error', message: 'server_error'});
  }
};

// POST /messages/mark-read - Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const {conversation_id, user_id} = req.body;

    // Validate required fields
    if (!conversation_id || !user_id) {
      return res.json({
        status: 'fail',
        message: 'missing_fields',
        missing: [
          !conversation_id && 'conversation_id', !user_id && 'user_id'
        ].filter(Boolean)
      });
    }

    const userIdNum = parseInt(user_id);
    if (isNaN(userIdNum)) {
      return res.json({status: 'fail', message: 'user_id_must_be_number'});
    }

    // Verify conversation exists
    const conversation = await Conversation.findById(conversation_id);
    if (!conversation) {
      return res.json({status: 'fail', message: 'conversation_not_found'});
    }

    // Verify user is a participant
    if (conversation.doctor_id !== userIdNum &&
        conversation.hospital_id !== userIdNum &&
        conversation.patient_id !== userIdNum) {
      return res.json(
          {status: 'fail', message: 'not_conversation_participant'});
    }

    // Determine user role
    let userRole = 'doctor';
    if (conversation.hospital_id === userIdNum) {
      userRole = 'hospital';
    } else if (conversation.patient_id === userIdNum) {
      userRole = 'patient';
    }

    // Mark all unread messages as read
    const updateResult = await Message.updateMany(
        {
          conversation_id: conversation_id,
          receiver_id: userIdNum,
          receiver_role: userRole,
          is_read: false
        },
        {$set: {is_read: true, read_at: new Date()}});

    // Update conversation unread count
    if (userRole === 'doctor') {
      conversation.unread_count.doctor = 0;
    } else if (userRole === 'hospital') {
      conversation.unread_count.hospital = 0;
    } else if (userRole === 'patient') {
      conversation.unread_count.patient = 0;
    }
    await conversation.save();

    return res.json({
      status: 'success',
      message: 'messages_marked_as_read',
      conversation_id: conversation_id,
      messages_marked: updateResult.modifiedCount
    });

  } catch (error) {
    console.error('Mark messages as read error:', error);
    return res.json({status: 'error', message: 'server_error'});
  }
};

module.exports = {
  getDoctorConversations,
  getConversationMessages,
  markMessagesAsRead
};
