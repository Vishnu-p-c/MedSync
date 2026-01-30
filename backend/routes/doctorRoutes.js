const express = require('express');
const router = express.Router();
const {createAppointment, getPatientAppointments, getDoctorAppointments} =
    require('../controllers/doctorController');

// Create a new appointment
// POST /doctor/appointment
router.post('/appointment', createAppointment);

// Get all upcoming appointments for a patient
// POST /doctor/appointment/patient
router.post('/appointment/patient', getPatientAppointments);

// Get all appointments for a doctor (verifies user is a doctor first)
// POST /doctor/appointment/doctor
router.post('/appointment/doctor', getDoctorAppointments);

module.exports = router;
