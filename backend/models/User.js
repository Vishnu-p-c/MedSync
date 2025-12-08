const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: {type: String, required: true, unique: true},
  username: {type: String, required: true, unique: true, trim: true},
  password_hash: {type: String, required: true},
  role: {type: String, required: true},
  email: {type: String, unique: true, trim: true},
  phone: {type: String},
  created_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('User', userSchema);
