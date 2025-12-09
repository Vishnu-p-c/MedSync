const router = require('express').Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

router.post('/', async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      latitude,
      longitude,
      first_name,
      last_name
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
    if (!address) missingFields.push('address');

    if (missingFields.length > 0) {
      return res.json(
          {status: 'fail', message: 'missing_fields', missing: missingFields});
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({$or: [{username}, {email}]});
    if (existingUser) {
      return res.json({status: 'fail', message: 'user_exists'});
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user_id (get max user_id and increment)
    const maxUser = await User.findOne().sort({user_id: -1}).limit(1);
    const newUserId = maxUser ? maxUser.user_id + 1 : 1;

    // Create new patient user
    const newUser = new User({
      user_id: newUserId,
      first_name,
      last_name: last_name || null,
      username,
      password_hash: hashedPassword,
      role: 'patient',  // Force role to patient
      email,
      phone,
      date_of_birth: new Date(date_of_birth),
      gender,
      address,
      latitude,
      longitude
    });

    await newUser.save();

    res.json({status: 'success', message: 'registered'});
  } catch (error) {
    res.json({status: 'fail', message: error.message});
  }
});

module.exports = router;
