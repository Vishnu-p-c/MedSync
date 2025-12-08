const mongoose = require('mongoose');

const ambulanceLiveLocationSchema = new mongoose.Schema({
  driver_id:
      {type: Number, required: true, unique: true, ref: 'AmbulanceDriver'},
  latitude: {type: Number},
  longitude: {type: Number},
  updated_at: {type: Date, default: Date.now}
});

module.exports =
    mongoose.model('AmbulanceLiveLocation', ambulanceLiveLocationSchema);
