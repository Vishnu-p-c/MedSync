const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
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

// POST /hospital/send-message - Send message from hospital to doctor(s)
const sendMessageToDoctor = async (req, res) => {
  try {
    const {hospital_id, doctor_ids, message} = req.body;

    // Validate required fields
    if (!hospital_id || !doctor_ids || !message) {
      return res.json({
        status: 'fail',
        message: 'missing_fields',
        missing: [
          !hospital_id && 'hospital_id', !doctor_ids && 'doctor_ids',
          !message && 'message'
        ].filter(Boolean)
      });
    }

    // Validate hospital exists
    const hospitalIdNum = parseInt(hospital_id);
    if (isNaN(hospitalIdNum)) {
      return res.json({status: 'fail', message: 'hospital_id_must_be_number'});
    }

    const hospital =
        await Hospital.findOne({hospital_id: hospitalIdNum}).lean();
    if (!hospital) {
      return res.json({status: 'fail', message: 'hospital_not_found'});
    }

    // Get list of doctors to message
    let targetDoctors = [];
    if (doctor_ids === 'all') {
      // Get all doctors linked to this hospital
      targetDoctors =
          await Doctor.find({hospital_id: {$in: [hospitalIdNum]}}).lean();

      if (targetDoctors.length === 0) {
        return res.json(
            {status: 'fail', message: 'no_doctors_found_for_hospital'});
      }
    } else if (Array.isArray(doctor_ids)) {
      // Get specific doctors - ensure they belong to this hospital
      const doctorIdNums =
          doctor_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (doctorIdNums.length === 0) {
        return res.json({status: 'fail', message: 'invalid_doctor_ids'});
      }

      targetDoctors = await Doctor
                          .find({
                            doctor_id: {$in: doctorIdNums},
                            hospital_id: {
                              $in: [hospitalIdNum]
                            }  // Verify doctors belong to this hospital
                          })
                          .lean();

      if (targetDoctors.length === 0) {
        return res.json(
            {status: 'fail', message: 'no_doctors_found_for_hospital'});
      }
    } else {
      return res.json(
          {status: 'fail', message: 'doctor_ids_must_be_array_or_all'});
    }

    const results = {
      total_doctors: targetDoctors.length,
      messages_sent: 0,
      notifications_sent: 0,
      failed_notifications: 0,
      conversations_created: 0
    };

    // Process each doctor
    for (const doctor of targetDoctors) {
      try {
        // Check if conversation exists
        let conversation = await Conversation.findOne({
          type: 'hospital_doctor',
          hospital_id: hospitalIdNum,
          doctor_id: doctor.doctor_id
        });

        // Create conversation if it doesn't exist
        if (!conversation) {
          conversation = new Conversation({
            type: 'hospital_doctor',
            participants: [
              {user_id: hospitalIdNum, role: 'hospital'},
              {user_id: doctor.doctor_id, role: 'doctor'}
            ],
            created_by: hospitalIdNum,
            doctor_id: doctor.doctor_id,
            hospital_id: hospitalIdNum,
            last_message: message.substring(0, 500),
            last_message_sender: hospitalIdNum,
            last_message_at: new Date(),
            unread_count: {doctor: 1, hospital: 0},
            is_active: true
          });
          await conversation.save();
          results.conversations_created++;
        } else {
          // Update existing conversation
          conversation.last_message = message.substring(0, 500);
          conversation.last_message_sender = hospitalIdNum;
          conversation.last_message_at = new Date();
          conversation.unread_count.doctor =
              (conversation.unread_count.doctor || 0) + 1;
          conversation.updated_at = new Date();
          await conversation.save();
        }

        // Insert message
        const newMessage = new Message({
          conversation_id: conversation._id,
          sender_id: hospitalIdNum,
          sender_role: 'hospital',
          receiver_id: doctor.doctor_id,
          receiver_role: 'doctor',
          message_type: 'text',
          content: message,
          is_read: false
        });
        await newMessage.save();
        results.messages_sent++;

        // Send FCM notification if doctor has a token
        if (doctor.fcm_token) {
          const fcmResult = await sendFCMNotification(
              doctor.fcm_token, 'New Hospital Message', message, {
                type: 'hospital_message',
                conversation_id: conversation._id.toString(),
                hospital_id: hospitalIdNum.toString(),
                doctor_id: doctor.doctor_id.toString(),
                hospital_name: hospital.name
              });

          if (fcmResult.success) {
            results.notifications_sent++;
          } else {
            results.failed_notifications++;
            // Clear invalid token
            if (fcmResult.error.includes(
                    'messaging/registration-token-not-registered') ||
                fcmResult.error.includes(
                    'messaging/invalid-registration-token')) {
              doctor.fcm_token = null;
              doctor.token_last_update = null;
              await Doctor.updateOne(
                  {doctor_id: doctor.doctor_id},
                  {$set: {fcm_token: null, token_last_update: null}});
              console.log(
                  `Cleared invalid FCM token for doctor ${doctor.doctor_id}`);
            }
          }
        }

      } catch (docError) {
        console.error(`Error processing doctor ${doctor.doctor_id}:`, docError);
        // Continue with next doctor
      }
    }

    return res.json({
      status: 'success',
      message: 'messages_sent',
      hospital_id: hospitalIdNum,
      hospital_name: hospital.name,
      results: results
    });

  } catch (error) {
    console.error('Send message to doctor error:', error);
    return res.json({status: 'error', message: 'server_error'});
  }
};

module.exports = {sendMessageToDoctor};
