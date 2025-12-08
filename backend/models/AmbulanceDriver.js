const mongoose = require('mongoose');

const ambulanceDriverSchema = new mongoose.Schema({
  driver_id: {type: String, required: true, unique: true},
  name: {type: String, required: true},
  license_number: {type: String, required: true},
  vehicle_number: {type: String, required: true},
  is_active: {type: Boolean, default: true},
  address_line: {type: String},
  address_line_hospital_id:
      {type: mongoose.Schema.Types.ObjectId, ref: 'Hospital'}
});

module.exports = mongoose.model('AmbulanceDriver', ambulanceDriverSchema);
