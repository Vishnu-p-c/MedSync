const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointment_id: {type: Number, required: true, unique: true},
  patient_id: {type: Number, ref: 'User'},
  doctor_id: {type: Number, ref: 'DoctorDetails'},
  // Null by default so appointments can be clinic-based
  hospital_id: {type: Number, ref: 'Hospital', default: null},
  // Clinic ID when consultation_place is 'clinic'
  clinic_id: {type: Number, ref: 'Clinic', default: null},
  // Where the consultation happens (supports doctors who consult in
  // clinic/hospital/both)
  consultation_place:
      {type: String, enum: ['hospital', 'clinic'], default: 'hospital'},
  // Used when consultation_place === 'clinic'
  clinic_name: {type: String, default: null, trim: true, maxLength: 200},
  appointment_time: {type: Date},
  status: {
    type: String,
    enum: ['upcoming', 'cancelled', 'completed'],
    default: 'upcoming'
  },
  created_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Appointment', appointmentSchema);
