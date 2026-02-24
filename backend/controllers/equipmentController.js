const Equipment = require('../models/Equipment');
const HospitalAdmin = require('../models/HospitalAdmin');

// POST /equipment/add - Add new equipment
const addEquipment = async (req, res) => {
  try {
    const {admin_id, equipment_name, status} = req.body;

    // Validate required fields
    const missing = [];
    if (!admin_id) missing.push('admin_id');
    if (!equipment_name) missing.push('equipment_name');
    if (!status) missing.push('status');

    if (missing.length > 0) {
      return res.status(400).json(
          {status: 'fail', message: 'missing_fields', missing});
    }

    // Validate admin_id is a number
    const adminIdNum = Number(admin_id);
    if (isNaN(adminIdNum)) {
      return res.status(400).json(
          {status: 'fail', message: 'admin_id_must_be_number'});
    }

    // Validate status enum
    const validStatuses = ['working', 'maintenance', 'down'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'invalid_status',
        valid_statuses: validStatuses
      });
    }

    // Get hospital_id for this admin
    const adminRecord = await HospitalAdmin.findOne({admin_id: adminIdNum});
    if (!adminRecord) {
      return res.status(404).json({status: 'fail', message: 'admin_not_found'});
    }

    const hospitalId = adminRecord.hospital_id;
    if (!hospitalId) {
      return res.status(400).json(
          {status: 'fail', message: 'admin_not_linked_to_hospital'});
    }

    // Generate new equipment_id (auto-increment)
    const lastEquipment =
        await Equipment.findOne().sort({equipment_id: -1}).lean();
    const newEquipmentId = lastEquipment ? lastEquipment.equipment_id + 1 : 1;

    // Create new equipment
    const newEquipment = new Equipment({
      equipment_id: newEquipmentId,
      hospital_id: hospitalId,
      equipment_name: equipment_name.trim(),
      status: status,
      last_updated: new Date()
    });

    await newEquipment.save();

    return res.status(201).json({
      status: 'success',
      message: 'equipment_added',
      equipment: {
        equipment_id: newEquipment.equipment_id,
        hospital_id: newEquipment.hospital_id,
        equipment_name: newEquipment.equipment_name,
        status: newEquipment.status,
        last_updated: newEquipment.last_updated
      }
    });

  } catch (err) {
    console.error('Error in /equipment/add:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
};

module.exports = {addEquipment};
