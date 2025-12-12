const mongoose = require('mongoose');

const doctorDetailsSchema = new mongoose.Schema({
  doctor_id: {type: Number, required: true, unique: true, ref: 'User'},
  hospital_id: {type: Number, ref: 'Hospital'},
  name: {type: String, maxLength: 100},
  department: {type: String, maxLength: 100},
  is_available: {type: Boolean, default: false},
  last_attendance_time: {type: Date}
});

module.exports = mongoose.model('DoctorDetails', doctorDetailsSchema);