const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointment_id: {type: Number, required: true, unique: true},
  patient_id: {type: Number, ref: 'User'},
  doctor_id: {type: Number, ref: 'DoctorDetails'},
  hospital_id: {type: Number, ref: 'Hospital'},
  appointment_time: {type: Date},
  status: {
    type: String,
    enum: ['upcoming', 'cancelled', 'completed'],
    default: 'upcoming'
  },
  created_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Appointment', appointmentSchema);
