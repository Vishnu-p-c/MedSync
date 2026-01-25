const mongoose = require('mongoose');

const ambulanceAssignmentSchema = new mongoose.Schema({
  assignment_id: {type: Number, required: true, unique: true},
  sos_id: {type: Number, ref: 'SosRequest'},
  driver_id: {type: Number, ref: 'AmbulanceDriver'},
  assigned_hospital_id: {type: Number, ref: 'Hospital'},
  assigned_at: {type: Date},
  route_eta: {type: Number},
  is_completed: {type: Boolean, default: false},
  completed_at: {type: Date}
});

module.exports =
    mongoose.model('AmbulanceAssignment', ambulanceAssignmentSchema);
