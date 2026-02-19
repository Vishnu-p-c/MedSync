const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  listDoctors,
  getBookingInfo,
  getDoctorSchedule,
  getDoctorSlots,
  bookAppointment,
  getDoctorWaitingQueue,
  updateDoctorFcmToken
} = require('../controllers/doctorController');

const {getDoctorConversations, getConversationMessages, markMessagesAsRead} =
    require('../controllers/doctorMessagingController');

const {doctorReplyMessage} =
    require('../controllers/patientMessagingController');

// Create a new appointment
// POST /doctor/appointment
router.post('/appointment', createAppointment);

// Book an appointment (new booking flow)
// POST /doctor/appointment/book
router.post('/appointment/book', bookAppointment);

// Get all upcoming appointments for a patient
// POST /doctor/appointment/patient
router.post('/appointment/patient', getPatientAppointments);

// Get all appointments for a doctor (verifies user is a doctor first)
// POST /doctor/appointment/doctor
router.post('/appointment/doctor', getDoctorAppointments);

// Get paginated list of doctors with filters and location-based sorting
// POST /doctor/list
router.post('/list', listDoctors);

// Get doctor booking info (for booking fragment)
// GET /doctor/:doctor_id/booking-info
router.get('/:doctor_id/booking-info', getBookingInfo);

// Get doctor's schedule for a specific location
// GET /doctor/:doctor_id/schedule?location_type=hospital&location_id=5
router.get('/:doctor_id/schedule', getDoctorSchedule);

// Get available time slots for a specific date
// GET
// /doctor/:doctor_id/slots?location_type=hospital&location_id=5&date=2026-01-23
router.get('/:doctor_id/slots', getDoctorSlots);

// Get doctor's waiting queue for today
// POST /doctor/waiting-queue
router.post('/waiting-queue', getDoctorWaitingQueue);

// Update doctor's FCM token for push notifications
// POST /doctor/update-fcm-token
router.post('/update-fcm-token', updateDoctorFcmToken);

// Get all conversations for a doctor
// GET /doctor/conversations?doctor_id=23&type=hospital_doctor
router.get('/conversations', getDoctorConversations);

// GET /doctor/conversations/:doctor_id - Get all conversations for a doctor
// (path param)
router.get('/conversations/:doctor_id', async (req, res) => {
  // Forward to getDoctorConversations with doctor_id from params
  req.query.doctor_id = req.params.doctor_id;
  return getDoctorConversations(req, res);
});

// POST /doctor/reply-message - Doctor replies to patient conversation
router.post('/reply-message', doctorReplyMessage);

module.exports = router;
