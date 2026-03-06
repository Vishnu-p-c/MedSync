const router = require('express').Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const HospitalAdmin = require('../models/HospitalAdmin');
const Hospital = require('../models/Hospital');

router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      username,
      email,
      phone,
      password,
      date_of_birth,
      gender,
      hospital_id,
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!first_name) missingFields.push('first_name');
    if (!username) missingFields.push('username');
    if (!password) missingFields.push('password');
    if (!email) missingFields.push('email');
    if (!phone) missingFields.push('phone');
    if (!date_of_birth) missingFields.push('date_of_birth');
    if (!gender) missingFields.push('gender');
    if (!hospital_id) missingFields.push('hospital_id');

    if (missingFields.length > 0) {
      return res.json(
          {status: 'fail', message: 'missing_fields', missing: missingFields});
    }

    // Verify hospital exists
    const hospital = await Hospital.findOne({hospital_id: Number(hospital_id)});
    if (!hospital) {
      return res.json({status: 'fail', message: 'hospital_not_found'});
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({$or: [{username}, {email}]});
    if (existingUser) {
      return res.json({status: 'fail', message: 'user_exists'});
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique user_id
    const maxUser = await User.findOne().sort({user_id: -1}).limit(1).lean();
    const newUserId = maxUser ? maxUser.user_id + 1 : 1;

    // Create user
    const newUser = new User({
      user_id: newUserId,
      first_name,
      last_name: last_name || '',
      username,
      password_hash: hashedPassword,
      role: 'admin',
      email,
      phone,
      date_of_birth: new Date(date_of_birth),
      gender,
    });

    await newUser.save();

    // Create hospital admin link
    const newAdmin = new HospitalAdmin({
      admin_id: newUserId,
      hospital_id: Number(hospital_id),
      admin_type: 'hospital',
    });

    await newAdmin.save();

    return res.json(
        {status: 'success', message: 'admin_registered', user_id: newUserId});
  } catch (err) {
    console.error('Register admin error:', err);
    return res.json(
        {status: 'fail', message: 'server_error', error: err.message});
  }
});

module.exports = router;
