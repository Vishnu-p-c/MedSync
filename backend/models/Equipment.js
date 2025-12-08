const mongoose = require('mongoose');

const equipmentStatusSchema = new mongoose.Schema({
  equipment_id: {type: Number, required: true, unique: true},
  hospital_id: {type: Number, ref: 'Hospital'},
  equipment_name: {type: String, required: true, maxLength: 100},
  status: {
    type: String,
    enum: ['working', 'down', 'maintenance'],
    default: 'working'
  },
  last_updated: {type: Date, default: Date.now}
});

module.exports = mongoose.model('EquipmentStatus', equipmentStatusSchema);