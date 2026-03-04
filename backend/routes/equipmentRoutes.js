const router = require('express').Router();
const {addEquipment, updateEquipmentStatus} =
    require('../controllers/equipmentController');

// POST /equipment/add - Add new equipment
router.post('/add', addEquipment);

// POST /equipment/update-status - Update equipment status
router.post('/update-status', updateEquipmentStatus);

module.exports = router;
