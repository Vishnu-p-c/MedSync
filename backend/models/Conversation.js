const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
    {
      user_id: {type: Number, required: true},
      role: {
        type: String,
        required: true,
        enum: ['patient', 'doctor', 'hospital']
      }
    },
    {_id: false});

const unreadCountSchema = new mongoose.Schema(
    {
      doctor: {type: Number, default: 0},
      patient: {type: Number, default: 0},
      hospital: {type: Number, default: 0}
    },
    {_id: false});

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['patient_doctor', 'hospital_doctor']
  },

  participants: {type: [participantSchema], required: true},

  created_by: {type: Number, required: true},

  doctor_id: {type: Number, required: true, ref: 'DoctorDetails'},
  patient_id: {type: Number, default: null, ref: 'User'},
  hospital_id: {type: Number, default: null, ref: 'Hospital'},

  last_message: {type: String, default: null, maxLength: 500},
  last_message_sender: {type: Number, default: null},
  last_message_at: {type: Date, default: null},

  unread_count: {type: unreadCountSchema, default: () => ({})},

  is_active: {type: Boolean, default: true},

  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
});

// Create indexes for efficient querying
conversationSchema.index({'participants.user_id': 1});
conversationSchema.index({doctor_id: 1});
conversationSchema.index({patient_id: 1});
conversationSchema.index({hospital_id: 1});
conversationSchema.index({type: 1, hospital_id: 1, doctor_id: 1});

module.exports = mongoose.model('Conversation', conversationSchema);
