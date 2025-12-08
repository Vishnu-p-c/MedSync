const mongoose = require('mongoose');

const doctorAttendanceLogSchema = new mongoose.Schema({
  log_id: {type: Number, required: true, unique: true},
  doctor_id: {type: Number, ref: 'DoctorDetails'},
  hospital_id: {type: Number, ref: 'Hospital'},
  timestamp: {type: Date, default: Date.now}
});

module.exports =
    mongoose.model('DoctorAttendanceLog', doctorAttendanceLogSchema);
