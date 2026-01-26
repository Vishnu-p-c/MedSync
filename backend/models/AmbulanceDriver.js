const mongoose = require('mongoose');

const ambulanceDriverSchema = new mongoose.Schema({
  driver_id: {type: Number, required: true, unique: true, ref: 'User'},
  first_name: {type: String, maxLength: 100},
  last_name: {type: String, maxLength: 100, default: ''},
  license_number: {type: String, maxLength: 100},
  vehicle_number: {type: String, maxLength: 50},
  is_active: {type: Boolean, default: false}
});

module.exports = mongoose.model('AmbulanceDriver', ambulanceDriverSchema);
