const mongoose = require('mongoose');

const interHospitalMessageSchema = new mongoose.Schema({
  message_id: {type: Number, required: true, unique: true},
  from_hospital_id: {type: Number, ref: 'Hospital'},
  to_hospital_id: {type: Number, ref: 'Hospital'},
  message: {type: String},
  timestamp: {type: Date, default: Date.now}
});

module.exports =
    mongoose.model('InterHospitalMessage', interHospitalMessageSchema);
