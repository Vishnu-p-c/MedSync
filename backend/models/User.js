const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: {type: Number, required: true, unique: true},
  first_name: {type: String, required: true, trim: true, maxLength: 50},
  last_name: {type: String, trim: true, maxLength: 50, default: ''},
  username:
      {type: String, required: true, unique: true, trim: true, maxLength: 50},
  password_hash: {type: String, required: true, maxLength: 255},
  role: {
    type: String,
    enum: ['admin', 'doctor', 'driver', 'patient'],
    required: true
  },
  email:
      {type: String, required: true, unique: true, trim: true, maxLength: 100},
  phone: {type: String, required: true, maxLength: 20},
  date_of_birth: {type: Date, required: true},
  gender: {type: String, enum: ['male', 'female', 'other'], required: true},
  address: {type: String, maxLength: 500, default: null},
  latitude: {type: Number},
  longitude: {type: Number},
  // FCM token for push notifications (patient messages)
  fcm_token: {type: String, default: null, trim: true},
  // Last time FCM token was updated
  token_last_update: {type: Date, default: null},
  created_at: {type: Date, default: Date.now},
  last_login: {type: Date, default: null}
});
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
