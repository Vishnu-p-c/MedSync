const mongoose = require('mongoose');

const hospitalAdminSchema = new mongoose.Schema({
  admin_id: {type: Number, required: true, ref: 'User'},
  hospital_id: {type: Number, required: true, ref: 'Hospital'}
});

// Compound primary key
hospitalAdminSchema.index({admin_id: 1, hospital_id: 1}, {unique: true});

module.exports = mongoose.model('HospitalAdmin', hospitalAdminSchema);
