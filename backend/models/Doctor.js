const mongoose = require('mongoose');

const doctorDetailsSchema = new mongoose.Schema({
  doctor_id: {type: Number, required: true, unique: true, ref: 'User'},
  // Doctor can consult in multiple hospitals; store as an array of hospital IDs
  // Kept null by default (not set during registration)
  hospital_id: {type: [Number], ref: 'Hospital', default: null},
  // Required doctor identity fields
  first_name: {type: String, required: true, trim: true, maxLength: 100},
  last_name: {type: String, trim: true, maxLength: 100},
  // Medical Record Number / Registration Number
  mrn: {type: String, required: true, trim: true, maxLength: 50},
  name: {type: String, maxLength: 100},
  department: {type: String, required: true, trim: true, maxLength: 100},
  is_available: {type: Boolean, default: false},
  // Keep null by default until first attendance is logged
  last_attendance_time: {type: Date, default: null},
  // Required by registration flow (whether doctor consults in multiple places)
  multi_place: {type: Boolean, required: true, default: false},
  // Qualifications of the doctor (e.g., MBBS, MD, MS)
  qualifications: {type: [String], required: true, default: []},
  // Optional: hospital names (for display) if needed
  hospitals: {type: [String], default: []},
  // Clinic names where the doctor consults
  clinics: {type: [String], default: []}
});

module.exports = mongoose.model('DoctorDetails', doctorDetailsSchema);