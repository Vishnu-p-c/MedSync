const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  doctor_id: {type: String, required: true, unique: true},
  name: {type: String, required: true},
  department: {type: String},
  specialization: {type: String},
  availability: {type: Boolean, default: true},
  last_attendance_time: {type: Date},
  hospital_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Hospital'}
});

module.exports = mongoose.model('Doctor', doctorSchema);