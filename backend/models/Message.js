const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Conversation'
  },

  sender_id: {type: Number, required: true},
  sender_role:
      {type: String, required: true, enum: ['patient', 'doctor', 'hospital']},

  receiver_id: {type: Number, required: true},
  receiver_role:
      {type: String, required: true, enum: ['patient', 'doctor', 'hospital']},

  message_type: {
    type: String,
    required: true,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },

  content: {type: String, required: true, maxLength: 2000},

  is_read: {type: Boolean, default: false},
  read_at: {type: Date, default: null},

  created_at: {type: Date, default: Date.now}
});

// Create index for efficient querying
messageSchema.index({conversation_id: 1, created_at: -1});

module.exports = mongoose.model('Message', messageSchema);
