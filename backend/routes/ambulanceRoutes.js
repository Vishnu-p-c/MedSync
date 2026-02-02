const router = require('express').Router();
const ambulanceController = require('../controllers/ambulanceController');

/**
 * @route   GET /admin/ambulance/drivers
 * @desc    Get all ambulance drivers near the admin's hospital district
 * @access  Private (Admin only)
 * @query   admin_id - The admin's user ID
 * @query   max_distance - Optional maximum distance in km (default: 50)
 */
router.get('/drivers', ambulanceController.getDriversNearHospital);

/**
 * @route   GET /admin/ambulance/summary
 * @desc    Get summary statistics for ambulance drivers
 * @access  Private (Admin only)
 * @query   admin_id - The admin's user ID
 */
router.get('/summary', ambulanceController.getDriversSummary);

/**
 * @route   PUT /admin/ambulance/driver-status
 * @desc    Update a driver's active/inactive status
 * @access  Private (Admin only)
 * @body    driver_id - The driver's ID
 * @body    is_active - Boolean indicating active status
 */
router.put('/driver-status', ambulanceController.updateDriverStatus);

module.exports = router;
