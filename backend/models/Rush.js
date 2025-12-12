const mongoose = require('mongoose');

const hospitalRushLogSchema = new mongoose.Schema({
  log_id: {type: Number, required: true, unique: true},
  hospital_id: {type: Number, ref: 'Hospital'},
  rush_level: {type: String, enum: ['low', 'medium', 'high', 'critical']},
  timestamp: {type: Date, default: Date.now}
});

module.exports = mongoose.model('HospitalRushLog', hospitalRushLogSchema);