const router = require('express').Router();
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Clinic = require('../models/Clinic');
const HospitalAdmin = require('../models/HospitalAdmin');
const EquipmentStatus = require('../models/Equipment');
const bcrypt = require('bcryptjs');

// POST /hospital/register
// Body: { name, address, latitude, longitude, rush_level }
// Creates a new hospital
router.post('/register', async (req, res) => {
  try {
    const {name, address, latitude, longitude, rush_level} = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json(
          {status: 'fail', message: 'missing_fields', missing: ['name']});
    }

    // Check if hospital with same name already exists
    const existingHospital = await Hospital.findOne(
        {name: {$regex: new RegExp(`^${name.trim()}$`, 'i')}});
    if (existingHospital) {
      return res.status(409).json({
        status: 'fail',
        message: 'hospital_exists',
        existing_hospital_id: existingHospital.hospital_id
      });
    }

    // Generate new hospital_id
    const lastHospital =
        await Hospital.findOne().sort({hospital_id: -1}).lean();
    const newHospitalId = lastHospital ? lastHospital.hospital_id + 1 : 1;

    // Validate rush_level if provided
    const validRushLevels = ['low', 'medium', 'high', 'critical'];
    const finalRushLevel =
        rush_level && validRushLevels.includes(rush_level) ? rush_level : 'low';

    // Create new hospital
    const newHospital = new Hospital({
      hospital_id: newHospitalId,
      name: name.trim(),
      address: address ? address.trim() : null,
      latitude: latitude || null,
      longitude: longitude || null,
      rush_level: finalRushLevel,
      updated_at: new Date()
    });

    await newHospital.save();

    return res.status(201).json({
      status: 'success',
      hospital_id: newHospital.hospital_id,
      name: newHospital.name,
      address: newHospital.address,
      latitude: newHospital.latitude,
      longitude: newHospital.longitude,
      rush_level: newHospital.rush_level
    });

  } catch (err) {
    console.error('Error in /hospital/register:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// POST /hospital/registeradmin
// Body: { first_name, last_name, username, password, email, phone,
// date_of_birth, gender, address, hospital_id OR clinic_id, admin_type }
// Creates a new admin user and links them to the hospital or clinic
// (admin_id = user_id)
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
      clinic_id,
      admin_type,
      latitude,
      longitude
    } = req.body;

    // Determine admin type: 'hospital' or 'clinic'
    const finalAdminType = admin_type === 'clinic' ? 'clinic' : 'hospital';

    // Validate required fields (hospital_id OR clinic_id based on admin_type)
    const required = [
      'first_name', 'username', 'password', 'email', 'phone', 'date_of_birth',
      'gender', 'address'
    ];

    // Add the appropriate ID requirement
    if (finalAdminType === 'clinic') {
      if (!clinic_id) {
        required.push('clinic_id');
      }
    } else {
      if (!hospital_id) {
        required.push('hospital_id');
      }
    }

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
    const adminData = {
      admin_id: newUserId,  // admin_id is same as user_id
      admin_type: finalAdminType
    };

    if (finalAdminType === 'clinic') {
      adminData.clinic_id = Number(clinic_id);
      adminData.hospital_id = null;
    } else {
      adminData.hospital_id = Number(hospital_id);
      adminData.clinic_id = null;
    }

    const hospitalAdmin = new HospitalAdmin(adminData);
    await hospitalAdmin.save();

    // Build response
    const response = {
      status: 'success',
      user_id: newUserId,
      admin_id: newUserId,  // Confirming admin_id = user_id
      admin_type: finalAdminType,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email
    };

    if (finalAdminType === 'clinic') {
      response.clinic_id = Number(clinic_id);
    } else {
      response.hospital_id = Number(hospital_id);
    }

    return res.status(201).json(response);

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
// Returns the hospital_id(s) and/or clinic_id(s) for the given admin
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

    // Find all hospitals/clinics this admin belongs to
    const adminLinks = await HospitalAdmin.find({admin_id: adminIdNum}).lean();

    if (!adminLinks || adminLinks.length === 0) {
      return res.status(404).json({status: 'fail', message: 'admin_not_found'});
    }

    // Separate hospital and clinic links
    const hospitalLinks = adminLinks.filter(
        link => link.admin_type === 'hospital' ||
            (!link.admin_type && link.hospital_id));
    const clinicLinks = adminLinks.filter(link => link.admin_type === 'clinic');

    // Build response
    const response = {
      status: 'success',
      admin_id: adminIdNum,
      all_hospitals:
          hospitalLinks.map(link => link.hospital_id).filter(id => id !== null),
      all_clinics:
          clinicLinks.map(link => link.clinic_id).filter(id => id !== null)
    };

    // Add primary hospital/clinic for convenience
    if (hospitalLinks.length > 0) {
      response.hospital_id = hospitalLinks[0].hospital_id;
    }
    if (clinicLinks.length > 0) {
      response.clinic_id = clinicLinks[0].clinic_id;
    }

    return res.json(response);

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

// POST /hospital/clinic/register
// Body: { name, address, latitude, longitude }
// Creates a new clinic
router.post('/clinic/register', async (req, res) => {
  try {
    const {name, address, latitude, longitude} = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json(
          {status: 'fail', message: 'missing_fields', missing: ['name']});
    }

    // Check if clinic with same name already exists
    const existingClinic = await Clinic.findOne(
        {name: {$regex: new RegExp(`^${name.trim()}$`, 'i')}});
    if (existingClinic) {
      return res.status(409).json({
        status: 'fail',
        message: 'clinic_exists',
        existing_clinic_id: existingClinic.clinic_id
      });
    }

    // Generate new clinic_id
    const lastClinic = await Clinic.findOne().sort({clinic_id: -1}).lean();
    const newClinicId = lastClinic ? lastClinic.clinic_id + 1 : 1;

    // Create new clinic
    const newClinic = new Clinic({
      clinic_id: newClinicId,
      name: name.trim(),
      address: address ? address.trim() : null,
      latitude: latitude || null,
      longitude: longitude || null
    });

    await newClinic.save();

    return res.status(201).json({
      status: 'success',
      clinic_id: newClinic.clinic_id,
      name: newClinic.name,
      address: newClinic.address,
      latitude: newClinic.latitude,
      longitude: newClinic.longitude
    });

  } catch (err) {
    console.error('Error in /hospital/clinic/register:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// GET /hospital/list
// Returns all hospitals
router.get('/list', async (req, res) => {
  try {
    const hospitals = await Hospital.find({}).lean();

    return res.json({
      status: 'success',
      total_hospitals: hospitals.length,
      hospitals: hospitals.map(h => ({
                                 hospital_id: h.hospital_id,
                                 name: h.name,
                                 address: h.address,
                                 latitude: h.latitude,
                                 longitude: h.longitude,
                                 rush_level: h.rush_level
                               }))
    });
  } catch (err) {
    console.error('Error in /hospital/list:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// GET /hospital/clinic/list
// Returns all clinics
router.get('/clinic/list', async (req, res) => {
  try {
    const clinics = await Clinic.find({}).lean();

    return res.json({
      status: 'success',
      total_clinics: clinics.length,
      clinics: clinics.map(c => ({
                             clinic_id: c.clinic_id,
                             name: c.name,
                             address: c.address,
                             latitude: c.latitude,
                             longitude: c.longitude
                           }))
    });
  } catch (err) {
    console.error('Error in /hospital/clinic/list:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

module.exports = router;
