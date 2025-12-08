const mongoose = require('mongoose');

const ambulanceLogLocationSchema = new mongoose.Schema({
  latitude: {type: Number, required: true},
  longitude: {type: Number, required: true},
  current_id: {type: String},
  other_id: {type: String}
});

module.exports =
    mongoose.model('AmbulanceLogLocation', ambulanceLogLocationSchema);
