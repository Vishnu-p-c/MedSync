const router = require('express').Router();
const doctorRegistrationController = require('../controllers/doctorRegistrationController');

/**
 * Doctor Registration Routes
 * API endpoints for admin to register new doctors
 */

// POST /admin/doctor-registration/add
// Register a new doctor
router.post('/add', doctorRegistrationController.registerDoctorByAdmin);

// GET /admin/doctor-registration/hospitals
// Get list of hospitals for dropdown
router.get('/hospitals', doctorRegistrationController.getHospitalsList);

// GET /admin/doctor-registration/clinics
// Get list of clinics for dropdown
router.get('/clinics', doctorRegistrationController.getClinicsList);

// GET /admin/doctor-registration/departments
// Get list of existing departments for dropdown
router.get('/departments', doctorRegistrationController.getDepartmentsList);

// POST /admin/doctor-registration/validate-mrn
// Validate if MRN is unique
router.post('/validate-mrn', doctorRegistrationController.validateMrn);

// POST /admin/doctor-registration/validate-username
// Validate if username is unique
router.post('/validate-username', doctorRegistrationController.validateUsername);

// POST /admin/doctor-registration/validate-email
// Validate if email is unique
router.post('/validate-email', doctorRegistrationController.validateEmail);

module.exports = router;
