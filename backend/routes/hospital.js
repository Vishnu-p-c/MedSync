const router = require('express').Router();
const User = require('../models/User');
const HospitalAdmin = require('../models/HospitalAdmin');
const EquipmentStatus = require('../models/Equipment');
const bcrypt = require('bcryptjs');

// POST /hospital/registeradmin
// Body: { first_name, last_name, username, password, email, phone,
// date_of_birth, gender, address, hospital_id } Creates a new admin user and
// links them to the hospital (admin_id = user_id)
router.post('/registeradmin', async (req, res) => {
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
      address,
      hospital_id,
      latitude,
      longitude
    } = req.body;

    // Validate required fields
    const required = [
      'first_name', 'username', 'password', 'email', 'phone', 'date_of_birth',
      'gender', 'address', 'hospital_id'
    ];
    const missing = required.filter(field => !req.body[field]);
    if (missing.length) {
      return res.status(400).json(
          {status: 'fail', message: 'missing_fields', missing});
    }

    // Check if user already exists
    const existingUser = await User.findOne({$or: [{username}, {email}]});
    if (existingUser) {
      return res.status(409).json({status: 'fail', message: 'user_exists'});
    }

    // Generate new user_id (find max and increment)
    const lastUser = await User.findOne().sort({user_id: -1}).lean();
    const newUserId = lastUser ? lastUser.user_id + 1 : 1;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create new admin user
    const newUser = new User({
      user_id: newUserId,
      first_name: first_name.trim(),
      last_name: last_name ? last_name.trim() : '',
      username: username.trim(),
      password_hash,
      role: 'admin',
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      date_of_birth: new Date(date_of_birth),
      gender,
      address: address.trim(),
      latitude: latitude || null,
      longitude: longitude || null,
      created_at: new Date()
    });

    await newUser.save();

    // Create HospitalAdmin link with admin_id = user_id
    const hospitalAdmin = new HospitalAdmin({
      admin_id: newUserId,  // admin_id is same as user_id
      hospital_id: Number(hospital_id)
    });

    await hospitalAdmin.save();

    return res.status(201).json({
      status: 'success',
      user_id: newUserId,
      admin_id: newUserId,  // Confirming admin_id = user_id
      hospital_id: Number(hospital_id),
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email
    });

  } catch (err) {
    console.error('Error in /hospital/registeradmin:', err);

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({status: 'fail', message: 'user_exists'});
    }

    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// POST /hospital/admin_hospital
// Body: { admin_id }
// Returns the hospital_id(s) for the given admin
router.post('/admin_hospital', async (req, res) => {
  try {
    const {admin_id} = req.body;

    if (admin_id === undefined || admin_id === null) {
      return res.status(400).json(
          {status: 'fail', message: 'missing_field: admin_id'});
    }

    const adminIdNum = Number(admin_id);
    if (isNaN(adminIdNum)) {
      return res.status(400).json(
          {status: 'fail', message: 'admin_id_must_be_number'});
    }

    // Find all hospitals this admin belongs to
    const adminLinks = await HospitalAdmin.find({admin_id: adminIdNum}).lean();

    if (!adminLinks || adminLinks.length === 0) {
      return res.status(404).json({status: 'fail', message: 'admin_not_found'});
    }

    // Return the first hospital_id (primary hospital)
    return res.json({
      status: 'success',
      admin_id: adminIdNum,
      hospital_id: adminLinks[0].hospital_id,
      all_hospitals: adminLinks.map(link => link.hospital_id)
    });

  } catch (err) {
    console.error('Error in /hospital/admin_hospital:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// POST /hospital/total_equipment
// Body: { hospital_id, admin_id }
// Returns all equipment for the hospital with status and last checked date
router.post('/total_equipment', async (req, res) => {
  try {
    const {hospital_id, admin_id} = req.body;

    // Validate required fields
    if (hospital_id === undefined || hospital_id === null) {
      return res.status(400).json(
          {status: 'fail', message: 'missing_field: hospital_id'});
    }
    if (admin_id === undefined || admin_id === null) {
      return res.status(400).json(
          {status: 'fail', message: 'missing_field: admin_id'});
    }

    const hospitalIdNum = Number(hospital_id);
    const adminIdNum = Number(admin_id);

    if (isNaN(hospitalIdNum) || isNaN(adminIdNum)) {
      return res.status(400).json({
        status: 'fail',
        message: 'hospital_id_and_admin_id_must_be_numbers'
      });
    }

    // Verify admin belongs to this hospital
    const adminLink =
        await HospitalAdmin
            .findOne({admin_id: adminIdNum, hospital_id: hospitalIdNum})
            .lean();

    if (!adminLink) {
      return res.status(403).json(
          {status: 'fail', message: 'admin_not_authorized_for_hospital'});
    }

    // Fetch all equipment for this hospital
    const equipment =
        await EquipmentStatus.find({hospital_id: hospitalIdNum}).lean();

    // Format response
    const equipmentList = equipment.map(item => ({
                                          equipment_id: item.equipment_id,
                                          name: item.equipment_name,
                                          status: item.status,
                                          last_checked: item.last_updated
                                        }));

    return res.json({
      status: 'success',
      hospital_id: hospitalIdNum,
      total_equipment: equipmentList.length,
      equipment: equipmentList
    });

  } catch (err) {
    console.error('Error in /hospital/total_equipment:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

module.exports = router;
