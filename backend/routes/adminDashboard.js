const router = require('express').Router();
const adminDashboardController = require('../controllers/adminDashboardController');

// Route to get doctors count for the logged-in admin's hospital
router.get('/doctors-count', adminDashboardController.getDoctorsCount);

module.exports = router;
