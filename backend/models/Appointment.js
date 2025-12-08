const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointment_id: {type: String, required: true, unique: true},
  appointment_time: {type: Date, required: true},
  status: {type: String, required: true},
  created_at: {type: Date, default: Date.now},
  doctor_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Doctor'},
  hospital_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Hospital'}
});

module.exports = mongoose.model('Appointment', appointmentSchema);
