const bcrypt = require('bcrypt');
const User = require('../models/User');
const DoctorDetails = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const Clinic = require('../models/Clinic');
const HospitalAdmin = require('../models/HospitalAdmin');

/**
 * Doctor Registration Controller
 * Handles doctor registration by admin users
 */

// Helper: Generate next user_id
const getNextUserId = async () => {
  const maxUser = await User.findOne().sort({ user_id: -1 }).limit(1).lean();
  return maxUser ? maxUser.user_id + 1 : 1;
};

// Helper: Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const matrix = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[s2.length][s1.length];
};

// Helper: Calculate similarity score
const similarityScore = (str1, str2) => {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLen);
};

// Helper: Find best matching entity
const findBestMatch = (inputName, entities, idField, threshold = 0.6) => {
  if (!inputName || !entities || entities.length === 0) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const entity of entities) {
    const score = similarityScore(inputName.trim(), entity.name);
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = {
        id: entity[idField],
        name: entity.name,
        score: Math.round(score * 100) / 100
      };
    }
  }

  return bestMatch;
};

/**
 * POST /admin/doctor-registration/add
 * Register a new doctor by admin
 * 
 * Required fields:
 * - admin_id: The logged-in admin's user_id
 * - first_name, username, password, email, phone, date_of_birth, gender
 * - mrn, department, qualifications (array)
 * 
 * Optional fields:
 * - last_name, multi_place (boolean), hospitals (array), clinics (array)
 */
exports.registerDoctorByAdmin = async (req, res) => {
  try {
    const {
      admin_id,
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
      multi_place = false,
      hospitals = [],
      clinics = []
    } = req.body;

    // Validate admin_id
    if (!admin_id) {
      return res.status(400).json({
        status: 'fail',
        message: 'admin_id is required'
      });
    }

    // Verify admin exists and get their facility
    const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });
    if (!adminRecord) {
      return res.status(403).json({
        status: 'fail',
        message: 'unauthorized_admin'
      });
    }

    // Validate required fields
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

    if (missing.length) {
      return res.status(400).json({
        status: 'fail',
        message: 'missing_fields',
        missing
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'fail',
        message: 'invalid_email_format'
      });
    }

    // Check if username, email, or phone already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }, { phone }]
    }).lean();

    if (existingUser) {
      let duplicateField = 'user';
      if (existingUser.username === username) duplicateField = 'username';
      else if (existingUser.email === email) duplicateField = 'email';
      else if (existingUser.phone === phone) duplicateField = 'phone';

      return res.status(409).json({
        status: 'fail',
        message: `${duplicateField}_exists`
      });
    }

    // Check if MRN already exists
    const existingMrn = await DoctorDetails.findOne({ mrn }).lean();
    if (existingMrn) {
      return res.status(409).json({
        status: 'fail',
        message: 'mrn_exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user_id
    let newUserId = await getNextUserId();
    const existingId = await User.findOne({ user_id: newUserId }).lean();
    if (existingId) {
      newUserId = newUserId + 1;
    }

    // Process hospitals and clinics with fuzzy matching
    const allHospitals = await Hospital.find({}).lean();
    const allClinics = await Clinic.find({}).lean();

    const matchedHospitalIds = [];
    const matchedHospitalNames = [];
    const matchedClinicIds = [];
    const matchedClinicNames = [];

    // Match hospitals
    for (const hospName of hospitals) {
      const match = findBestMatch(hospName, allHospitals, 'hospital_id', 0.6);
      if (match && !matchedHospitalIds.includes(match.id)) {
        matchedHospitalIds.push(match.id);
        matchedHospitalNames.push(match.name);
      }
    }

    // Match clinics
    for (const clinicName of clinics) {
      const match = findBestMatch(clinicName, allClinics, 'clinic_id', 0.6);
      if (match && !matchedClinicIds.includes(match.id)) {
        matchedClinicIds.push(match.id);
        matchedClinicNames.push(match.name);
      }
    }

    // ALWAYS ensure the admin's facility is included (doctors must belong to the admin's hospital/clinic)
    if (adminRecord.admin_type === 'hospital' && adminRecord.hospital_id) {
      if (!matchedHospitalIds.includes(adminRecord.hospital_id)) {
        matchedHospitalIds.unshift(adminRecord.hospital_id); // Add admin's hospital first
        const hospital = await Hospital.findOne({ hospital_id: adminRecord.hospital_id }).lean();
        if (hospital) matchedHospitalNames.unshift(hospital.name);
      }
    } else if (adminRecord.admin_type === 'clinic' && adminRecord.clinic_id) {
      if (!matchedClinicIds.includes(adminRecord.clinic_id)) {
        matchedClinicIds.unshift(adminRecord.clinic_id); // Add admin's clinic first
        const clinic = await Clinic.findOne({ clinic_id: adminRecord.clinic_id }).lean();
        if (clinic) matchedClinicNames.unshift(clinic.name);
      }
    }

    // Create User record
    const newUser = new User({
      user_id: newUserId,
      first_name: first_name.trim(),
      last_name: last_name?.trim() || '',
      username: username.trim(),
      password_hash: hashedPassword,
      role: 'doctor',
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      date_of_birth: new Date(date_of_birth),
      gender: gender.toLowerCase()
    });

    await newUser.save();

    // Create Doctor Details record
    const doctorName = last_name
      ? `${first_name.trim()} ${last_name.trim()}`
      : first_name.trim();

    const newDoctor = new DoctorDetails({
      doctor_id: newUserId,
      hospital_id: matchedHospitalIds,
      clinic_id: matchedClinicIds,
      first_name: first_name.trim(),
      last_name: last_name?.trim() || '',
      mrn: mrn.trim(),
      name: doctorName,
      department: department.trim(),
      is_available: false,
      multi_place: multi_place,
      qualifications: qualifications.map(q => q.trim()),
      hospitals: matchedHospitalNames,
      clinics: matchedClinicNames
    });

    await newDoctor.save();

    return res.status(201).json({
      status: 'success',
      message: 'doctor_registered_successfully',
      data: {
        user_id: newUserId,
        doctor_id: newUserId,
        name: doctorName,
        email: email.trim().toLowerCase(),
        department: department.trim(),
        mrn: mrn.trim(),
        qualifications: qualifications,
        hospitals: matchedHospitalNames,
        clinics: matchedClinicNames
      }
    });

  } catch (error) {
    console.error('Error registering doctor by admin:', error);
    return res.status(500).json({
      status: 'error',
      message: 'server_error',
      error: error.message
    });
  }
};

/**
 * GET /admin/doctor-registration/hospitals
 * Get list of hospitals for dropdown
 */
exports.getHospitalsList = async (req, res) => {
  try {
    const { admin_id } = req.query;

    if (!admin_id) {
      return res.status(400).json({
        status: 'fail',
        message: 'admin_id is required'
      });
    }

    // Verify admin
    const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });
    if (!adminRecord) {
      return res.status(403).json({
        status: 'fail',
        message: 'unauthorized_admin'
      });
    }

    const hospitals = await Hospital.find({}).select('hospital_id name').lean();

    return res.json({
      status: 'success',
      data: hospitals.map(h => ({
        id: h.hospital_id,
        name: h.name
      }))
    });

  } catch (error) {
    console.error('Error fetching hospitals list:', error);
    return res.status(500).json({
      status: 'error',
      message: 'server_error'
    });
  }
};

/**
 * GET /admin/doctor-registration/clinics
 * Get list of clinics for dropdown
 */
exports.getClinicsList = async (req, res) => {
  try {
    const { admin_id } = req.query;

    if (!admin_id) {
      return res.status(400).json({
        status: 'fail',
        message: 'admin_id is required'
      });
    }

    // Verify admin
    const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });
    if (!adminRecord) {
      return res.status(403).json({
        status: 'fail',
        message: 'unauthorized_admin'
      });
    }

    const clinics = await Clinic.find({}).select('clinic_id name').lean();

    return res.json({
      status: 'success',
      data: clinics.map(c => ({
        id: c.clinic_id,
        name: c.name
      }))
    });

  } catch (error) {
    console.error('Error fetching clinics list:', error);
    return res.status(500).json({
      status: 'error',
      message: 'server_error'
    });
  }
};

/**
 * GET /admin/doctor-registration/departments
 * Get list of existing departments for dropdown
 */
exports.getDepartmentsList = async (req, res) => {
  try {
    const { admin_id } = req.query;

    if (!admin_id) {
      return res.status(400).json({
        status: 'fail',
        message: 'admin_id is required'
      });
    }

    // Verify admin
    const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });
    if (!adminRecord) {
      return res.status(403).json({
        status: 'fail',
        message: 'unauthorized_admin'
      });
    }

    // Get unique departments from existing doctors
    const departments = await DoctorDetails.distinct('department');

    return res.json({
      status: 'success',
      data: departments.filter(d => d && d.trim() !== '').sort()
    });

  } catch (error) {
    console.error('Error fetching departments list:', error);
    return res.status(500).json({
      status: 'error',
      message: 'server_error'
    });
  }
};

/**
 * POST /admin/doctor-registration/validate-mrn
 * Check if MRN is unique before submitting the form
 */
exports.validateMrn = async (req, res) => {
  try {
    const { mrn } = req.body;

    if (!mrn) {
      return res.status(400).json({
        status: 'fail',
        message: 'mrn is required'
      });
    }

    const existingMrn = await DoctorDetails.findOne({ mrn: mrn.trim() }).lean();

    return res.json({
      status: 'success',
      isUnique: !existingMrn
    });

  } catch (error) {
    console.error('Error validating MRN:', error);
    return res.status(500).json({
      status: 'error',
      message: 'server_error'
    });
  }
};

/**
 * POST /admin/doctor-registration/validate-username
 * Check if username is unique before submitting the form
 */
exports.validateUsername = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        status: 'fail',
        message: 'username is required'
      });
    }

    const existingUser = await User.findOne({ username: username.trim() }).lean();

    return res.json({
      status: 'success',
      isUnique: !existingUser
    });

  } catch (error) {
    console.error('Error validating username:', error);
    return res.status(500).json({
      status: 'error',
      message: 'server_error'
    });
  }
};

/**
 * POST /admin/doctor-registration/validate-email
 * Check if email is unique before submitting the form
 */
exports.validateEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'email is required'
      });
    }

    const existingUser = await User.findOne({ 
      email: email.trim().toLowerCase() 
    }).lean();

    return res.json({
      status: 'success',
      isUnique: !existingUser
    });

  } catch (error) {
    console.error('Error validating email:', error);
    return res.status(500).json({
      status: 'error',
      message: 'server_error'
    });
  }
};
