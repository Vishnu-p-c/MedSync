const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
  clinic_id: {type: Number, required: true, unique: true},
  name: {type: String, required: true, maxLength: 100},
  address: {type: String, maxLength: 255},
  latitude: {type: Number},
  longitude: {type: Number}
});

module.exports = mongoose.model('Clinic', clinicSchema);
