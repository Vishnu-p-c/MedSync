const mongoose = require('mongoose');

const hospitalAttendanceSchema = new mongoose.Schema(
    {
      last_marked_at: {type: Date, default: null},
      is_available: {type: Boolean, default: false}
    },
    {_id: false});

const doctorDetailsSchema = new mongoose.Schema({
  doctor_id: {type: Number, required: true, unique: true, ref: 'User'},
  // Doctor can consult in multiple hospitals; store as an array of hospital IDs
  // Kept null by default (not set during registration)
  hospital_id: {type: [Number], ref: 'Hospital', default: null},
  // Doctor can consult in multiple clinics; store as an array of clinic IDs
  clinic_id: {type: [Number], ref: 'Clinic', default: null},
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
  // Per-hospital attendance/availability. Keys are hospital_id (as string).
  hospital_attendance: {type: Map, of: hospitalAttendanceSchema, default: {}},
  // Which hospital the doctor is currently marked available at (if any)
  current_hospital_id: {type: Number, ref: 'Hospital', default: null},
  // Required by registration flow (whether doctor consults in multiple places)
  multi_place: {type: Boolean, required: true, default: false},
  // Qualifications of the doctor (e.g., MBBS, MD, MS)
  qualifications: {type: [String], required: true, default: []},
  // Optional: hospital names (for display) if needed
  hospitals: {type: [String], default: []},
  // Clinic names where the doctor consults
  clinics: {type: [String], default: []},
  // FCM token for push notifications (hospital messages)
  fcm_token: {type: String, default: null, trim: true},
  // Last time FCM token was updated
  token_last_update: {type: Date, default: null}
});

module.exports = mongoose.model('DoctorDetails', doctorDetailsSchema);