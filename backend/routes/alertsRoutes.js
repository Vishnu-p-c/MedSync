const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alertsController');

// Get all alerts
router.get('/', alertsController.getAllAlerts);

// Get alerts summary (for sidebar badge)
router.get('/summary', alertsController.getAlertsSummary);

// Mark alert as read
router.post('/read', alertsController.markAlertRead);

module.exports = router;
