const router = require('express').Router();
const bcrypt = require('bcrypt');

const User = require('../models/User');
const DoctorDetails = require('../models/Doctor');

// POST /registerdoctor
// Required (User): first_name, username, password, email, phone, date_of_birth,
// gender Optional (User): last_name Required (DoctorDetails): mrn, department,
// qualifications (array), multi_place (boolean) Optional (DoctorDetails):
// hospitals (array of strings), clinics (array of strings)
router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      username,
      email,
      password,
      phone,
      date_of_birth,
      gender,
      mrn,
      department,
      qualifications,
      multi_place,
      hospitals,
      hospital,
      clinics,
      clinic
    } = req.body;

    const missing = [];
    if (!first_name) missing.push('first_name');
    if (!username) missing.push('username');
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    if (!phone) missing.push('phone');
    if (!date_of_birth) missing.push('date_of_birth');
    if (!gender) missing.push('gender');

    if (!mrn) missing.push('mrn');
    if (!department) missing.push('department');

    if (!Array.isArray(qualifications) || qualifications.length === 0) {
      missing.push('qualifications');
    }

    if (typeof multi_place !== 'boolean') {
      missing.push('multi_place');
    }

    if (missing.length) {
      return res.status(400).json(
          {status: 'fail', message: 'missing_fields', missing});
    }

    // Normalize optional lists
    const normalizedHospitals = Array.isArray(hospitals) ?
        hospitals :
        (Array.isArray(hospital) ? hospital : []);
    const normalizedClinics = Array.isArray(clinics) ?
        clinics :
        (Array.isArray(clinic) ? clinic : []);

    // If multi_place is true, allow hospital/clinic list to be optional per
    // request, but enforce at least one location to avoid a useless state.
    if (multi_place === true) {
      const hasAnyLocation =
          normalizedHospitals.length > 0 || normalizedClinics.length > 0;
      if (!hasAnyLocation) {
        return res.status(400).json({
          status: 'fail',
          message: 'missing_fields',
          missing: ['hospitals_or_clinics']
        });
      }
    }

    // Ensure username/email/phone uniqueness
    const existingUser =
        await User.findOne({$or: [{username}, {email}, {phone}]}).lean();
    if (existingUser) {
      return res.json({status: 'fail', message: 'user_exists'});
    }

    // Ensure MRN uniqueness at DoctorDetails level (recommended)
    const existingMrn = await DoctorDetails.findOne({mrn}).lean();
    if (existingMrn) {
      return res.json({status: 'fail', message: 'mrn_exists'});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user_id (max + 1) with a simple race check
    const maxUser = await User.findOne().sort({user_id: -1}).limit(1).lean();
    const newUserId = maxUser ? maxUser.user_id + 1 : 1;

    const existingId = await User.findOne({user_id: newUserId}).lean();
    const finalUserId = existingId ? newUserId + 1 : newUserId;

    const newUser = new User({
      user_id: finalUserId,
      first_name,
      last_name: last_name || null,
      username: String(username).trim(),
      password_hash: hashedPassword,
      role: 'doctor',
      email,
      phone,
      date_of_birth: new Date(date_of_birth),
      gender,
      address: null,
      latitude: null,
      longitude: null
    });

    await newUser.save();

    // doctor_id must match user_id (1:1)
    const doctorDetails = new DoctorDetails({
      doctor_id: newUser.user_id,
      first_name,
      last_name: last_name || null,
      mrn,
      department,
      qualifications,
      multi_place,
      hospitals: normalizedHospitals,
      clinics: normalizedClinics,
      is_available: false,
      last_attendance_time: null
    });

    await doctorDetails.save();

    return res.json({
      status: 'success',
      user_id: newUser.user_id,
      doctor_id: doctorDetails.doctor_id
    });
  } catch (err) {
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

module.exports = router;
