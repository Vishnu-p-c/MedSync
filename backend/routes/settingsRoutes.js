const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Profile routes
router.get('/profile', settingsController.getProfile);
router.put('/profile', settingsController.updateProfile);

// Password route
router.put('/password', settingsController.changePassword);

// Hospital info routes
router.get('/hospital', settingsController.getHospitalInfo);
router.put('/hospital', settingsController.updateHospitalInfo);

module.exports = router;
