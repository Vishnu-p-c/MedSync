const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  hospital_id: {type: Number, required: true, unique: true},
  name: {type: String, required: true, maxLength: 100},
  address: {type: String, maxLength: 255},
  latitude: {type: Number},
  longitude: {type: Number},
  rush_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  updated_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Hospital', hospitalSchema);
