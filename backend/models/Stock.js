const mongoose = require('mongoose');

const medicineStockSchema = new mongoose.Schema({
  stock_id: {type: Number, required: true, unique: true},
  hospital_id: {type: Number, ref: 'Hospital'},
  item_name: {type: String, maxLength: 100},
  quantity: {type: Number},
  last_updated: {type: Date, default: Date.now}
});

module.exports = mongoose.model('MedicineStock', medicineStockSchema);
// test