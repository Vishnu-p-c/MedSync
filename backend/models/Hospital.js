const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  hospital_id: {type: String, required: true, unique: true},
  name: {type: String, required: true},
  location: {type: String},
  latitude: {type: Number},
  longitude: {type: Number},
  address: {type: String},
  updated_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Hospital', hospitalSchema);
