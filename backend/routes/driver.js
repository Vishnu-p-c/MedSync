const router = require('express').Router();
const AmbulanceDriver = require('../models/AmbulanceDriver');
const AmbulanceLiveLocation = require('../models/AmbulanceLiveLocation');
const AmbulanceAssignment = require('../models/AmbulanceAssignment');
const SosRequest = require('../models/SosRequest');
const User = require('../models/User');
const Hospital = require('../models/Hospital');

// POST /driver/duty
// Body: { driver_id: Number, on_duty: Boolean }
router.post('/duty', async (req, res) => {
  try {
    const {driver_id, on_duty} = req.body;

    const missing = [];
    if (driver_id === undefined || driver_id === null)
      missing.push('driver_id');
    if (on_duty === undefined || on_duty === null) missing.push('on_duty');
    if (missing.length)
      return res.status(400).json(
          {status: 'fail', message: 'missing_fields', missing});

    const driverIdNum = Number(driver_id);
    if (isNaN(driverIdNum))
      return res.status(400).json(
          {status: 'fail', message: 'driver_id_must_be_number'});

    const driver = await AmbulanceDriver.findOne({driver_id: driverIdNum});
    if (!driver)
      return res.status(404).json(
          {status: 'fail', message: 'driver_not_found'});

    // on_duty expected boolean; coerce for safety
    const isOnDuty = Boolean(on_duty);

    driver.is_active = isOnDuty;
    await driver.save();

    // If driver switched off-duty, remove live location record to prevent stale
    // eligibility
    if (!isOnDuty) {
      try {
        await AmbulanceLiveLocation.deleteOne({driver_id: driverIdNum});
      } catch (e) {
        console.error(
            'Error removing live location for off-duty driver', driverIdNum, e);
      }
    }

    return res.json({
      status: 'success',
      driver_id: driver.driver_id,
      is_active: driver.is_active
    });
  } catch (err) {
    console.error('Error in /driver/duty:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// POST /driver/location
// Body: { driver_id: Number, latitude: Number, longitude: Number }
// Only accepted when driver is on-duty (is_active === true)
router.post('/location', async (req, res) => {
  try {
    const {driver_id, latitude, longitude} = req.body;
    const missing = [];
    if (driver_id === undefined || driver_id === null)
      missing.push('driver_id');
    if (latitude === undefined || latitude === null) missing.push('latitude');
    if (longitude === undefined || longitude === null)
      missing.push('longitude');
    if (missing.length)
      return res.status(400).json(
          {status: 'fail', message: 'missing_fields', missing});

    const driverIdNum = Number(driver_id);
    if (isNaN(driverIdNum))
      return res.status(400).json(
          {status: 'fail', message: 'driver_id_must_be_number'});

    const driver = await AmbulanceDriver.findOne({driver_id: driverIdNum});
    if (!driver)
      return res.status(404).json(
          {status: 'fail', message: 'driver_not_found'});

    if (!driver.is_active) {
      // Reject location updates from off-duty drivers
      return res.status(403).json({status: 'fail', message: 'driver_off_duty'});
    }

    const latNum = Number(latitude);
    const lonNum = Number(longitude);
    if (isNaN(latNum) || isNaN(lonNum))
      return res.status(400).json(
          {status: 'fail', message: 'invalid_coordinates'});

    // Upsert live location (unique driver_id)
    await AmbulanceLiveLocation.findOneAndUpdate(
        {driver_id: driverIdNum},
        {$set: {latitude: latNum, longitude: lonNum, updated_at: new Date()}},
        {upsert: true, new: true});

    return res.json({status: 'success', driver_id: driverIdNum});
  } catch (err) {
    console.error('Error in /driver/location:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// POST /driver/assigned-sos
// Body: { driver_id: Number }
router.post('/assigned-sos', async (req, res) => {
  try {
    const {driver_id} = req.body;
    if (driver_id === undefined || driver_id === null) {
      return res.status(400).json(
          {status: 'fail', message: 'missing_field: driver_id'});
    }

    const driverIdNum = Number(driver_id);
    if (isNaN(driverIdNum)) {
      return res.status(400).json(
          {status: 'fail', message: 'driver_id_must_be_number'});
    }

    const driver =
        await AmbulanceDriver.findOne({driver_id: driverIdNum}).lean();
    if (!driver) {
      console.error('Assigned SOS poll: driver not found', driverIdNum);
      return res.status(404).json(
          {status: 'fail', message: 'driver_not_found'});
    }

    if (!driver.is_active) {
      // Driver not on duty — no active assignment
      return res.json({status: 'no_assignment'});
    }

    // Find the most recent assignment for this driver
    const assignment =
        await AmbulanceAssignment.findOne({driver_id: driverIdNum})
            .sort({assigned_at: -1})
            .lean();
    if (!assignment || !assignment.sos_id) {
      return res.json({status: 'no_assignment'});
    }

    // Fetch the SOS and ensure its status is 'assigned'
    const sos = await SosRequest.findOne({sos_id: assignment.sos_id}).lean();
    if (!sos) {
      console.error(
          'Assigned SOS poll: sos not found for assignment', assignment);
      return res.json({status: 'no_assignment'});
    }

    if (sos.status !== 'assigned') {
      // Only return currently assigned SOS
      return res.json({status: 'no_assignment'});
    }

    // Fetch patient record
    const patient = await User.findOne({user_id: sos.patient_id}).lean();
    const patientName = patient ?
        ((patient.last_name && String(patient.last_name).trim()) ?
             `${(patient.first_name || '').trim()} ${
                 (patient.last_name || '').trim()}`
                 .trim() :
             (patient.first_name || '').trim()) :
        null;

    // Resolve hospital name if assigned_hospital_id exists
    let assignedHospitalName = null;
    try {
      if (sos.assigned_hospital_id !== undefined &&
          sos.assigned_hospital_id !== null) {
        const hosp =
            await Hospital.findOne({hospital_id: sos.assigned_hospital_id})
                .lean();
        assignedHospitalName = hosp ? hosp.name : null;
      }
    } catch (err) {
      console.error('Error fetching assigned hospital name:', err);
      assignedHospitalName = null;
    }

    return res.json({
      status: 'assigned',
      sos_id: sos.sos_id,
      patient_id: sos.patient_id,
      patient_name: patientName,
      patient_latitude: sos.latitude,
      patient_longitude: sos.longitude,
      assigned_hospital_name: assignedHospitalName,
      eta: sos.eta_minutes || 10
    });
  } catch (err) {
    console.error('Error in /driver/assigned-sos:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

module.exports = router;
