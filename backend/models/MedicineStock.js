const mongoose = require('mongoose');

const medicineStockSchema = new mongoose.Schema({
  stock_id: {type: String, required: true, unique: true},
  item_name: {type: String, required: true},
  quantity: {type: Number, required: true},
  last_updated: {type: Date, default: Date.now},
  hospital_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Hospital'}
});

module.exports = mongoose.model('MedicineStock', medicineStockSchema);
