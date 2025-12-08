const mongoose = require('mongoose');

const hospitalRunsLogSchema = new mongoose.Schema({
  hospital_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Hospital'},
  log_id: {type: String, required: true},
  rush_level: {type: String},
  timestamp: {type: Date, default: Date.now}
});

module.exports = mongoose.model('HospitalRunsLog', hospitalRunsLogSchema);
