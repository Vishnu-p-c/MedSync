const router = require('express').Router();
const adminDashboardController = require('../controllers/adminDashboardController');

// Route to get doctors count for the logged-in admin's hospital
router.get('/doctors-count', adminDashboardController.getDoctorsCount);

// Route to get critical alerts (equipment under maintenance and low stock)
router.get('/critical-alerts', adminDashboardController.getCriticalAlerts);

module.exports = router;
