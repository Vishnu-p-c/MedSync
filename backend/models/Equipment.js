const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  equipment_id: {type: String, required: true, unique: true},
  equipment_name: {type: String, required: true},
  status: {type: String, required: true},
  last_updated: {type: Date, default: Date.now},
  hospital_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Hospital'}
});

module.exports = mongoose.model('Equipment', equipmentSchema);