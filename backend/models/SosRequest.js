const mongoose = require('mongoose');

const sosRequestSchema = new mongoose.Schema({
  sos_id: {type: Number, required: true, unique: true},
  patient_id: {type: Number, ref: 'User'},
  latitude: {type: Number},
  longitude: {type: Number},
  severity: {
    type: String,
    enum: ['critical', 'severe', 'moderate', 'mild', 'unknown'],
    default: 'unknown'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'cancelled', 'completed'],
    default: 'pending'
  },
  created_at: {type: Date, default: Date.now},
  eta_minutes: {type: Number, default: null},
  cancelled_before_pickup: {type: Boolean, default: false},
  assigned_driver_id: {type: Number, ref: 'AmbulanceDriver'},
  assigned_hospital_id: {type: Number, ref: 'Hospital'}
});

module.exports = mongoose.model('SosRequest', sosRequestSchema);
