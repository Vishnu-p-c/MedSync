const mongoose = require('mongoose');

const sosRequestSchema = new mongoose.Schema({
  request_id: {type: String, required: true, unique: true},
  assigned_driver_id:
      {type: mongoose.Schema.Types.ObjectId, ref: 'AmbulanceDriver'},
  status: {type: String, required: true},
  severity: {type: String},
  longitude: {type: Number},
  latitude: {type: Number},
  created_at: {type: Date, default: Date.now},
  cancelled_before_pickup: {type: Boolean, default: false},
  assigned_hospital_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Hospital'}
});

module.exports = mongoose.model('SosRequest', sosRequestSchema);
