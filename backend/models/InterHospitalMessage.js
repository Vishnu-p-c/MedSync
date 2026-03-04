const mongoose = require('mongoose');

const interHospitalMessageSchema = new mongoose.Schema({
  message_id: {type: Number, required: true, unique: true},
  from_hospital_id: {type: Number, required: true, ref: 'Hospital'},
  to_hospital_id: {type: Number, required: true, ref: 'Hospital'},
  from_admin_id: {type: Number, default: null},
  message: {type: String, required: true, maxLength: 2000},
  subject: {type: String, default: '', maxLength: 200},
  priority:
      {type: String, enum: ['normal', 'urgent', 'critical'], default: 'normal'},
  is_read: {type: Boolean, default: false},
  read_at: {type: Date, default: null},
  is_broadcast: {type: Boolean, default: false},
  parent_message_id: {type: Number, default: null},
  timestamp: {type: Date, default: Date.now}
});

interHospitalMessageSchema.index(
    {to_hospital_id: 1, is_read: 1, timestamp: -1});
interHospitalMessageSchema.index({from_hospital_id: 1, timestamp: -1});

module.exports =
    mongoose.model('InterHospitalMessage', interHospitalMessageSchema);
