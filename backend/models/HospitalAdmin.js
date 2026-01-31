const mongoose = require('mongoose');

const hospitalAdminSchema = new mongoose.Schema({
  admin_id: {type: Number, required: true, ref: 'User'},
  // For hospital admins: store hospital_id, for clinic admins: store clinic_id
  hospital_id: {type: Number, ref: 'Hospital', default: null},
  clinic_id: {type: Number, ref: 'Clinic', default: null},
  // 'hospital' or 'clinic' to distinguish admin type
  admin_type: {type: String, enum: ['hospital', 'clinic'], default: 'hospital'}
});

// Compound index for hospital admins
hospitalAdminSchema.index(
    {admin_id: 1, hospital_id: 1},
    {unique: true, partialFilterExpression: {hospital_id: {$ne: null}}});

// Compound index for clinic admins
hospitalAdminSchema.index(
    {admin_id: 1, clinic_id: 1},
    {unique: true, partialFilterExpression: {clinic_id: {$ne: null}}});

module.exports = mongoose.model('HospitalAdmin', hospitalAdminSchema);
