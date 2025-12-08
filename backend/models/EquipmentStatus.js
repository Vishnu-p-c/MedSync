const mongoose = require('mongoose');

const equipmentStatusSchema = new mongoose.Schema({
  equipment_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Equipment'},
  status: {type: String, required: true},
  last_updated: {type: Date, default: Date.now}
});

module.exports = mongoose.model('EquipmentStatus', equipmentStatusSchema);
