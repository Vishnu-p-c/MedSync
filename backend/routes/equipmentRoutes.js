const router = require('express').Router();
const {addEquipment} = require('../controllers/equipmentController');

// POST /equipment/add - Add new equipment
router.post('/add', addEquipment);

module.exports = router;
