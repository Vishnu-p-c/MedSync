const router = require('express').Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const AmbulanceDriver = require('../models/AmbulanceDriver');

// POST /registerdriver
// Fields: first_name, last_name (optional), password, email, phone,
// date_of_birth, gender, driving_license_no, vehicle_no
router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      username,
      password,
      email,
      phone,
      date_of_birth,
      gender,
      driving_license_no,
      vehicle_no
    } = req.body;

    const missing = [];
    if (!first_name) missing.push('first_name');
    if (!username) missing.push('username');
    if (!password) missing.push('password');
    if (!email) missing.push('email');
    if (!phone) missing.push('phone');
    if (!date_of_birth) missing.push('date_of_birth');
    if (!gender) missing.push('gender');
    if (!driving_license_no) missing.push('driving_license_no');
    if (!vehicle_no) missing.push('vehicle_no');

    if (missing.length) {
      return res.status(400).json(
          {status: 'fail', message: 'missing_fields', missing});
    }

    // Ensure username/email/phone uniqueness
    const existingUser =
        await User.findOne({$or: [{username}, {email}, {phone}]});
    if (existingUser) return res.json({status: 'fail', message: 'user_exists'});

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user_id (max + 1) with a simple race check similar to
    // registerpatient
    const maxUser = await User.findOne().sort({user_id: -1}).limit(1).lean();
    const newUserId = maxUser ? maxUser.user_id + 1 : 1;
    const existingId = await User.findOne({user_id: newUserId});
    if (existingId) {
      const retryMax = await User.findOne().sort({user_id: -1}).limit(1).lean();
      const retryId = retryMax ? retryMax.user_id + 1 : 1;
      return await createDriverUser(retryId);
    }

    return await createDriverUser(newUserId);

    async function createDriverUser(userId) {
      const finalUsername = String(username).trim();

      const newUser = new User({
        user_id: userId,
        first_name,
        last_name: last_name || null,
        username: finalUsername,
        password_hash: hashedPassword,
        role: 'driver',
        email,
        phone,
        date_of_birth: new Date(date_of_birth),
        gender,
        address: null
      });

      await newUser.save();

      const newDriver = new AmbulanceDriver({
        driver_id: newUser.user_id,
        first_name,
        last_name: last_name || '',
        license_number: driving_license_no,
        vehicle_number: vehicle_no,
        is_active: false
      });

      await newDriver.save();

      return res.json({
        status: 'success',
        user_id: newUser.user_id,
        driver_id: newDriver.driver_id,
        username: newUser.username
      });
    }
  } catch (err) {
    console.error('Error registering driver:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

module.exports = router;
