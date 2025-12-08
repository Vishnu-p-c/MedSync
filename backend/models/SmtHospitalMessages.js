const mongoose = require('mongoose');

const smtHospitalMessagesSchema = new mongoose.Schema({
  from_hospital_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Hospital'},
  to_hospital_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Hospital'},
  message: {type: String, required: true},
  timestamp: {type: Date, default: Date.now}
});

module.exports =
    mongoose.model('SmtHospitalMessages', smtHospitalMessagesSchema);
