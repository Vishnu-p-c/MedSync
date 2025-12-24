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
    enum: [
      'pending', 'awaiting_driver', 'awaiting_driver_response', 'assigned',
      'cancelled', 'completed'
    ],
    default: 'pending'
  },
  created_at: {type: Date, default: Date.now},
  eta_minutes: {type: Number, default: null},
  cancelled_before_pickup: {type: Boolean, default: false},
  assigned_driver_id: {type: Number, ref: 'AmbulanceDriver'},
  assigned_at: {type: Date, default: null},
  arrived_at: {type: Date, default: null},
  assigned_hospital_id: {type: Number, ref: 'Hospital'},
  // New fields for driver acceptance workflow
  current_driver_candidate:
      {type: Number, ref: 'AmbulanceDriver', default: null},
  rejected_drivers: {type: [Number], default: []},
  request_sent_at: {type: Date, default: null},
  // Queue of eligible driver IDs ordered by priority (nearest first)
  candidate_queue: {type: [Number], default: []}
});

module.exports = mongoose.model('SosRequest', sosRequestSchema);
