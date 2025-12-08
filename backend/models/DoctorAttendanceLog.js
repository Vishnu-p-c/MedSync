const mongoose = require('mongoose');

const doctorAttendanceLogSchema = new mongoose.Schema({
  log_id: {type: String, required: true, unique: true},
  doctor_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Doctor'},
  check_in: {type: Date},
  check_out: {type: Date}
});

module.exports =
    mongoose.model('DoctorAttendanceLog', doctorAttendanceLogSchema);
