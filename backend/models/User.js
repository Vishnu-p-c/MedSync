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
  email:
      {type: String, required: true, unique: true, trim: true, maxLength: 100},
  phone: {type: String, required: true, maxLength: 20},
  date_of_birth: {type: Date, required: true},
  gender: {type: String, enum: ['male', 'female', 'other']},
  address: {type: String, maxLength: 500},
  latitude: {type: Number},
  longitude: {type: Number},
  created_at: {type: Date, default: Date.now}
});

// Custom validation: if role is patient, address is required
userSchema.pre('save', function(next) {
  if (this.role === 'patient' && !this.address) {
    next(new Error('Address is required for patients'));
  } else {
    next();
  }
});

module.exports = mongoose.model('User', userSchema);
