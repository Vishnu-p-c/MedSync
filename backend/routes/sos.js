const express = require('express');
const router = express.Router();

const SosRequest = require('../models/SosRequest');
const AmbulanceDriver = require('../models/AmbulanceDriver');
const AmbulanceLiveLocation = require('../models/AmbulanceLiveLocation');
// const Hospital = require('../models/Hospital'); // optional for future use

// Helper: allowed severity values come from the schema
const ALLOWED_SEVERITIES =
    ['critical', 'severe', 'moderate', 'mild', 'unknown'];

// POST /sos/create
router.post('/create', async (req, res) => {
  try {
    const {patient_id, latitude, longitude, severity} = req.body;

    // Validate required fields
    const missing = [];
    if (patient_id === undefined || patient_id === null)
      missing.push('patient_id');
    if (latitude === undefined || latitude === null) missing.push('latitude');
    if (longitude === undefined || longitude === null)
      missing.push('longitude');

    if (missing.length) {
      return res.status(400).json(
          {status: 'error', message: `missing_fields: ${missing.join(', ')}`});
    }

    // Validate numeric values
    if (isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      return res.status(400).json(
          {status: 'error', message: 'latitude_and_longitude_must_be_numbers'});
    }

    // Validate severity (treat missing/empty as 'unknown')
    let severityToStore;
    if (severity === undefined || severity === null || severity === '') {
      severityToStore = 'unknown';
    } else if (!ALLOWED_SEVERITIES.includes(severity)) {
      return res.status(400).json({
        status: 'error',
        message: `invalid_severity: allowed=${ALLOWED_SEVERITIES.join(',')}`
      });
    } else {
      severityToStore = severity;
    }

    // Generate sos_id using current timestamp (ms)
    const sosId = Date.now();

    const sosDoc = new SosRequest({
      sos_id: sosId,
      patient_id: Number(patient_id),
      latitude: Number(latitude),
      longitude: Number(longitude),
      // only set severity when it's valid per schema
      severity: severityToStore,
      status: 'pending',
      assigned_driver_id: null,
      assigned_hospital_id: null,
      created_at: new Date(),
      cancelled_before_pickup: false
    });

    await sosDoc.save();

    return res.json({status: 'success', message: 'sos_created', sos_id: sosId});
  } catch (err) {
    console.error('Error creating SOS request:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// GET /sos/status?sos_id=123
router.get('/status', async (req, res) => {
  try {
    const {sos_id} = req.query;
    if (!sos_id) {
      return res.status(400).json(
          {status: 'error', message: 'missing_query_param: sos_id'});
    }

    const sosIdNum = Number(sos_id);
    if (isNaN(sosIdNum)) {
      return res.status(400).json(
          {status: 'error', message: 'sos_id_must_be_number'});
    }

    const sos = await SosRequest.findOne({sos_id: sosIdNum}).lean();
    if (!sos) {
      // as requested: return the string "sos_not_found"
      return res.json('sos_not_found');
    }

    if (sos.status === 'pending') {
      return res.json({status: 'pending'});
    }

    if (sos.status === 'assigned') {
      const driverId = sos.assigned_driver_id;
      let driver = null;
      if (driverId !== undefined && driverId !== null) {
        driver =
            await AmbulanceDriver.findOne({driver_id: Number(driverId)}).lean();
      }

      return res.json({
        status: 'assigned',
        driver_name: driver ? driver.name : null,
        vehicle_number: driver ? driver.vehicle_number : null,
        assigned_hospital_id: sos.assigned_hospital_id || null,
        eta: 10
      });
    }

    // cancelled or completed -> return status
    if (sos.status === 'cancelled' || sos.status === 'completed') {
      return res.json({status: sos.status});
    }

    // Fallback
    return res.json({status: sos.status || 'unknown'});
  } catch (err) {
    console.error('Error fetching SOS status:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// POST /sos/cancel  route
router.post('/cancel', async (req, res) => {
  try {
    const {sos_id, patient_id} = req.body;

    // Validate required fields
    const missing = [];
    if (sos_id === undefined || sos_id === null) missing.push('sos_id');
    if (patient_id === undefined || patient_id === null)
      missing.push('patient_id');
    if (missing.length) {
      return res.status(400).json(
          {status: 'error', message: `missing_fields: ${missing.join(', ')}`});
    }

    const sosIdNum = Number(sos_id);
    if (isNaN(sosIdNum)) {
      return res.status(400).json(
          {status: 'error', message: 'sos_id_must_be_number'});
    }

    const sos = await SosRequest.findOne({sos_id: sosIdNum});
    if (!sos) {
      return res.json({status: 'sos_not_found'});
    }

    // If already completed, cannot cancel
    if (sos.status === 'completed') {
      return res.json({status: 'fail', message: 'cannot_cancel_now'});
    }

    // If already cancelled
    if (sos.status === 'cancelled') {
      return res.json({status: 'already_cancelled'});
    }

    // Optional: ensure the requesting patient is the owner of the SOS
    if (Number(sos.patient_id) !== Number(patient_id)) {
      return res.status(403).json(
          {status: 'fail', message: 'not_request_owner'});
    }

    // Only pending or assigned can be cancelled
    if (sos.status === 'pending' || sos.status === 'assigned') {
      sos.status = 'cancelled';
      sos.cancelled_before_pickup = true;
      await sos.save();
      return res.json({status: 'success', message: 'sos_cancelled'});
    }

    // Fallback
    return res.json({status: 'fail', message: 'cannot_cancel_now'});
  } catch (err) {
    console.error('Error cancelling SOS request:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

module.exports = router;
