const router = require('express').Router();
const rushController = require('../controllers/rushController');

// Get current rush level for admin's facility
router.get('/level', rushController.getRushLevel);

// Update rush level manually
router.put('/level', rushController.updateRushLevel);

// Calculate rush level based on metrics (auto-calculation)
router.get('/calculate', rushController.calculateRushLevel);

module.exports = router;
