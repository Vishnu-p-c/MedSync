const mongoose = require('mongoose');

const doctorDetailsSchema = new mongoose.Schema({
  doctor_id: {type: Number, required: true, unique: true, ref: 'User'},
  // Default null so doctors can be clinic-only or multi-place
  hospital_id: {type: Number, ref: 'Hospital', default: null},
  // Required doctor identity fields
  first_name: {type: String, required: true, trim: true, maxLength: 100},
  last_name: {type: String, trim: true, maxLength: 100},
  name: {type: String, maxLength: 100},
  department: {type: String, maxLength: 100},
  is_available: {type: Boolean, default: false},
  // Keep null by default until first attendance is logged
  last_attendance_time: {type: Date, default: null},
  // If true, doctor can consult in multiple places (hospital/clinic/both)
  multi_place: {type: Boolean, default: false},
  // Qualifications of the doctor (e.g., MBBS, MD, MS)
  qualifications: {type: [String], default: []},
  // Stores consultation locations (hospital or clinic). For hospital entries,
  // hospital_id can be provided.
  locations: {
    type: [{
      place_type: {type: String, enum: ['hospital', 'clinic'], required: true},
      name: {type: String, required: true, trim: true, maxLength: 200},
      hospital_id: {type: Number, ref: 'Hospital', default: null}
    }],
    default: []
  }
});

doctorDetailsSchema.path('locations').validate(function(locations) {
  if (this.multi_place === true) {
    return Array.isArray(locations) && locations.length > 0;
  }
  return true;
}, 'locations must be provided when multi_place is true');

module.exports = mongoose.model('DoctorDetails', doctorDetailsSchema);