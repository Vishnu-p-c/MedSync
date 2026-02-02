const router = require('express').Router();
const adminDashboardController = require('../controllers/adminDashboardController');

// Route to get hospital/clinic info for the admin
router.get('/hospital-info', adminDashboardController.getHospitalInfo);

// Route to get doctors count for the logged-in admin's hospital
router.get('/doctors-count', adminDashboardController.getDoctorsCount);

// Route to get all doctors for the admin's hospital/clinic with search and filter
router.get('/doctors', adminDashboardController.getDoctorsList);

// Route to get unique departments for filtering
router.get('/doctors/departments', adminDashboardController.getDepartments);

// Route to get critical alerts (equipment under maintenance and low stock)
router.get('/critical-alerts', adminDashboardController.getCriticalAlerts);

// Route to get patient inflow data (hourly for last 24 hours)
router.get('/patient-inflow', adminDashboardController.getPatientInflow);

// Route to add a new doctor to the admin's hospital/clinic
router.post('/doctors/add', adminDashboardController.addDoctor);

module.exports = router;
