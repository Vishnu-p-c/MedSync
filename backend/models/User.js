const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: {type: Number, required: true, unique: true},
  username:
      {type: String, required: true, unique: true, trim: true, maxLength: 50},
  password_hash: {type: String, required: true, maxLength: 255},
  role: {
    type: String,
    enum: ['admin', 'doctor', 'driver', 'patient'],
    required: true
  },
  phone: {type: String, maxLength: 20},
  created_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('User', userSchema);
