const router = require('express').Router();
const bcrypt = require('bcrypt');

const User = require('../models/User');
const DoctorDetails = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const Clinic = require('../models/Clinic');
const DoctorSchedule = require('../models/DoctorSchedule');

// Levenshtein distance for fuzzy matching
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
            matrix[i - 1][j - 1] + 1,  // substitution
            matrix[i][j - 1] + 1,      // insertion
            matrix[i - 1][j] + 1       // deletion
        );
      }
    }
  }
  return matrix[s2.length][s1.length];
};

// Calculate similarity score (0 to 1, where 1 is exact match)
const similarityScore = (str1, str2) => {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLen);
};

// Find best matching entity from a list (hospital or clinic)
// Returns { id, name, score } or null if no good match found
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

    // Fuzzy match hospitals and clinics to get IDs
    const allHospitals = await Hospital.find({}).lean();
    const allClinics = await Clinic.find({}).lean();

    const matchedHospitalIds = [];
    const matchedHospitalNames = [];
    const unmatchedHospitals = [];

    for (const hospName of normalizedHospitals) {
      const match = findBestMatch(hospName, allHospitals, 'hospital_id', 0.6);
      if (match) {
        if (!matchedHospitalIds.includes(match.id)) {
          matchedHospitalIds.push(match.id);
          matchedHospitalNames.push(match.name);
        }
      } else {
        // Could not match - store the name as-is for display
        unmatchedHospitals.push(hospName);
      }
    }

    const matchedClinicIds = [];
    const matchedClinicNames = [];
    const unmatchedClinics = [];

    for (const clinicName of normalizedClinics) {
      const match = findBestMatch(clinicName, allClinics, 'clinic_id', 0.6);
      if (match) {
        if (!matchedClinicIds.includes(match.id)) {
          matchedClinicIds.push(match.id);
          matchedClinicNames.push(match.name);
        }
      } else {
        // Could not match - store the name as-is for display
        unmatchedClinics.push(clinicName);
      }
    }

    // Combine matched names with unmatched names for display
    const finalHospitalNames = [...matchedHospitalNames, ...unmatchedHospitals];
    const finalClinicNames = [...matchedClinicNames, ...unmatchedClinics];

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
      hospital_id: matchedHospitalIds.length > 0 ? matchedHospitalIds : null,
      clinic_id: matchedClinicIds.length > 0 ? matchedClinicIds : null,
      hospitals: finalHospitalNames,
      clinics: finalClinicNames,
      is_available: false,
      last_attendance_time: null
    });

    await doctorDetails.save();

    // Auto-create DoctorSchedule using hospital/clinic default schedules
    const hospitalScheduleMap = {};
    const clinicScheduleMap = {};

    // Build hospital schedules from matched hospitals using their
    // default_schedule
    for (const hospId of matchedHospitalIds) {
      const hospital = allHospitals.find(h => h.hospital_id === hospId);
      if (hospital) {
        // Use hospital's default_schedule or fallback to standard weekday slots
        const defaultSlots =
            hospital.default_schedule && hospital.default_schedule.length > 0 ?
            hospital.default_schedule.map(
                s => ({
                  day: s.day,
                  start: s.start,
                  end: s.end,
                  slot_duration: s.slot_duration || 30,
                  max_patients: s.max_patients || 4
                })) :
            [
              {
                day: 'monday',
                start: '09:00',
                end: '13:00',
                slot_duration: 30,
                max_patients: 4
              },
              {
                day: 'wednesday',
                start: '09:00',
                end: '13:00',
                slot_duration: 30,
                max_patients: 4
              },
              {
                day: 'friday',
                start: '09:00',
                end: '13:00',
                slot_duration: 30,
                max_patients: 4
              }
            ];

        hospitalScheduleMap[hospId.toString()] = {
          location_name: hospital.name,
          slots: defaultSlots
        };
      }
    }

    // Build clinic schedules from matched clinics using their default_schedule
    for (const clinicId of matchedClinicIds) {
      const clinic = allClinics.find(c => c.clinic_id === clinicId);
      if (clinic) {
        // Use clinic's default_schedule or fallback to evening/weekend slots
        const defaultSlots =
            clinic.default_schedule && clinic.default_schedule.length > 0 ?
            clinic.default_schedule.map(s => ({
                                          day: s.day,
                                          start: s.start,
                                          end: s.end,
                                          slot_duration: s.slot_duration || 30,
                                          max_patients: s.max_patients || 3
                                        })) :
            [
              {
                day: 'tuesday',
                start: '17:00',
                end: '20:00',
                slot_duration: 30,
                max_patients: 3
              },
              {
                day: 'saturday',
                start: '10:00',
                end: '14:00',
                slot_duration: 30,
                max_patients: 3
              }
            ];

        clinicScheduleMap[clinicId.toString()] = {
          location_name: clinic.name,
          slots: defaultSlots
        };
      }
    }

    // Create DoctorSchedule entry
    const doctorSchedule = new DoctorSchedule({
      doctor_id: doctorDetails.doctor_id,
      hospital_schedule: hospitalScheduleMap,
      clinic_schedule: clinicScheduleMap
    });

    await doctorSchedule.save();

    return res.json({
      status: 'success',
      user_id: newUser.user_id,
      doctor_id: doctorDetails.doctor_id,
      matched_hospitals: matchedHospitalNames,
      unmatched_hospitals: unmatchedHospitals,
      matched_clinics: matchedClinicNames,
      unmatched_clinics: unmatchedClinics,
      schedule_created: true
    });
  } catch (err) {
    console.error('Register doctor error:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

module.exports = router;
