const mongoose = require('mongoose');

const ambulancePingGeofenceSchema = new mongoose.Schema({
  driver_id: {type: mongoose.Schema.Types.ObjectId, ref: 'AmbulanceDriver'},
  route_end: {type: String},
  is_completed: {type: Boolean, default: false},
  component_id: {type: String},
  assigned_hospital_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Hospital'}
});

module.exports =
    mongoose.model('AmbulancePingGeofence', ambulancePingGeofenceSchema);
