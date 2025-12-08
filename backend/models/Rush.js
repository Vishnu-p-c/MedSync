const mongoose = require('mongoose');

const rushSchema = new mongoose.Schema({
  rush_id: {type: String, required: true, unique: true},
  status: {type: String, required: true},
  timestamp: {type: Date, default: Date.now},
  hospital_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Hospital'}
});

module.exports = mongoose.model('Rush', rushSchema);