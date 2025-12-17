const router = require('express').Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const AmbulanceDriver = require('../models/AmbulanceDriver');

router.post('/', async (req, res) => {
  const {username, email, password} = req.body;

  // Allow login with either username or email
  const user =
      await User.findOne({$or: [{username: username}, {email: email}]});

  if (!user) return res.json({status: 'fail', message: 'user_not_found'});

  // Compare password with bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return res.json({status: 'fail', message: 'incorrect_password'});
  }

  // Build base response (exclude username/password)
  const baseResponse = {
    status: 'success',
    user_id: user.user_id,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    email: user.email,
    phone: user.phone,
    date_of_birth: user.date_of_birth,
    gender: user.gender,
    latitude: user.latitude,
    longitude: user.longitude,
    created_at: user.created_at
  };

  // If user is a driver, return license_number and vehicle_number instead of
  // address
  if (user.role === 'driver') {
    try {
      const driver =
          await AmbulanceDriver.findOne({driver_id: user.user_id}).lean();
      baseResponse.license_number = driver ? driver.license_number : null;
      baseResponse.vehicle_number = driver ? driver.vehicle_number : null;
    } catch (err) {
      baseResponse.license_number = null;
      baseResponse.vehicle_number = null;
    }
  } else {
    baseResponse.address = user.address;
  }

  res.json(baseResponse);
});

module.exports = router;
