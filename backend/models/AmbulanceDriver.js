const mongoose = require('mongoose');

const ambulanceDriverSchema = new mongoose.Schema({
  driver_id: {type: Number, required: true, unique: true, ref: 'User'},
  name: {type: String, maxLength: 100},
  license_number: {type: String, maxLength: 100},
  vehicle_number: {type: String, maxLength: 50},
  added_by_hospital_id: {type: Number, ref: 'Hospital'},
  is_active: {type: Boolean, default: true}
});

module.exports = mongoose.model('AmbulanceDriver', ambulanceDriverSchema);
