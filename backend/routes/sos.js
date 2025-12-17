const express = require('express');
const router = express.Router();

const SosRequest = require('../models/SosRequest');
const AmbulanceDriver = require('../models/AmbulanceDriver');
const AmbulanceLiveLocation = require('../models/AmbulanceLiveLocation');
const AmbulanceAssignment = require('../models/AmbulanceAssignment');
// const Hospital = require('../models/Hospital'); // optional for future use
const https = require('https');
const {URL} = require('url');

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

    // Try to assign nearest available driver asynchronously but
    // do not fail the request if assignment cannot be completed.
    (async () => {
      try {
        await assignNearestDriver(sosDoc);
      } catch (err) {
        console.error('Assignment error (non-fatal):', err);
      }
    })();

    return res.json({status: 'success', message: 'sos_created', sos_id: sosId});
  } catch (err) {
    console.error('Error creating SOS request:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// (GET /sos/status removed — use POST /sos/status which accepts `sos_id` in the
// body)

// POST /sos/status (accept sos_id in body) - mirrors GET /status
router.post('/status', async (req, res) => {
  try {
    const {sos_id} = req.body;
    if (!sos_id)
      return res.status(400).json(
          {status: 'error', message: 'missing_field: sos_id'});

    const sosIdNum = Number(sos_id);
    if (isNaN(sosIdNum))
      return res.status(400).json(
          {status: 'error', message: 'sos_id_must_be_number'});

    const sos = await SosRequest.findOne({sos_id: sosIdNum}).lean();
    if (!sos) return res.json('sos_not_found');

    if (sos.status === 'pending') return res.json({status: 'pending'});

    if (sos.status === 'assigned') {
      const driverId = sos.assigned_driver_id;
      let driver = null;
      if (driverId !== undefined && driverId !== null) {
        driver =
            await AmbulanceDriver.findOne({driver_id: Number(driverId)}).lean();
      }

      return res.json({
        status: 'assigned',
        driver_name: driver ? `${(driver.first_name || '').trim()} ${
                                  (driver.last_name || '').trim()}`
                                  .trim() :
                              null,
        vehicle_number: driver ? driver.vehicle_number : null,
        assigned_hospital_id: sos.assigned_hospital_id || null,
        eta: sos.eta_minutes || 10
      });
    }

    if (sos.status === 'cancelled' || sos.status === 'completed')
      return res.json({status: sos.status});

    return res.json({status: sos.status || 'unknown'});
  } catch (err) {
    console.error('Error fetching SOS status (POST):', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// --- Assignment helper -------------------------------------------------
// Find nearest active driver with a live location and atomically assign
async function assignNearestDriver(sos) {
  if (!sos || typeof sos.latitude !== 'number' ||
      typeof sos.longitude !== 'number') {
    throw new Error('invalid_sos_coordinates');
  }

  // Fetch active drivers
  const drivers = await AmbulanceDriver.find({is_active: true}).lean();
  if (!drivers || drivers.length === 0) {
    // no drivers - leave SOS pending
    return null;
  }

  // For each driver, get their latest live location
  const candidates = [];
  for (const d of drivers) {
    try {
      const live =
          await AmbulanceLiveLocation.findOne({driver_id: d.driver_id}).lean();
      if (!live || live.latitude === undefined || live.longitude === undefined)
        continue;

      const distKm = haversineDistanceKm(
          sos.latitude, sos.longitude, live.latitude, live.longitude);
      candidates.push({driver: d, live, distKm});
    } catch (err) {
      console.error(
          'Error fetching live location for driver', d.driver_id, err);
      continue;
    }
  }

  if (candidates.length === 0) return null;

  // pick nearest
  candidates.sort((a, b) => a.distKm - b.distKm);
  const bestCandidate = candidates[0];
  const best = bestCandidate.driver;
  const bestLive = bestCandidate.live;

  // Try to compute realistic ETA via Google Maps Distance Matrix
  let etaMinutes = 10;  // default fallback
  try {
    const computed = await getEtaFromGoogle(
        bestLive.latitude, bestLive.longitude, sos.latitude, sos.longitude);
    if (computed && Number.isFinite(computed) && computed > 0)
      etaMinutes = computed;
  } catch (err) {
    console.error('Google Maps ETA error - falling back to default ETA:', err);
  }

  // atomic update: only assign if SOS still pending
  const updated = await SosRequest
                      .findOneAndUpdate(
                          {sos_id: sos.sos_id, status: 'pending'}, {
                            $set: {
                              status: 'assigned',
                              assigned_driver_id: best.driver_id,
                              assigned_hospital_id: null,
                              eta_minutes: etaMinutes
                            }
                          },
                          {new: true})
                      .lean();

  // If we successfully transitioned the SOS to 'assigned', create an
  // AmbulanceAssignment record exactly once (use upsert with $setOnInsert).
  if (updated) {
    try {
      await AmbulanceAssignment.findOneAndUpdate(
          {sos_id: sos.sos_id}, {
            $setOnInsert: {
              assignment_id: Date.now(),
              sos_id: sos.sos_id,
              driver_id: best.driver_id,
              assigned_hospital_id: updated.assigned_hospital_id || null,
              assigned_at: new Date()
            }
          },
          {upsert: true, new: true});
    } catch (err) {
      console.error('Error creating AmbulanceAssignment record:', err);
    }
  }

  return updated;
}

/**
 * Query Google Maps Distance Matrix API to get ETA in minutes (rounded up).
 * Returns integer minutes or throws on network/parse errors.
 */
async function getEtaFromGoogle(originLat, originLon, destLat, destLon) {
  const apiKey = process.env.API_MAP;
  if (!apiKey) {
    throw new Error('API_MAP not configured');
  }

  const params =
      new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  params.searchParams.append('origins', `${originLat},${originLon}`);
  params.searchParams.append('destinations', `${destLat},${destLon}`);
  params.searchParams.append('mode', 'driving');
  params.searchParams.append('units', 'metric');
  params.searchParams.append('key', apiKey);

  const timeoutMs = 5000;

  return new Promise((resolve, reject) => {
    const req = https.get(params.toString(), {timeout: timeoutMs}, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status !== 'OK' || !json.rows || !json.rows[0] ||
              !json.rows[0].elements) {
            return reject(new Error('No route in Google response'));
          }
          const elem = json.rows[0].elements[0];
          if (!elem || elem.status !== 'OK' || !elem.duration ||
              !elem.duration.value) {
            return reject(new Error('No duration in Google response'));
          }
          const seconds = Number(elem.duration.value);
          const minutes = Math.ceil(seconds / 60);
          return resolve(minutes);
        } catch (err) {
          return reject(err);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy(new Error('Google Maps request timed out'));
    });
  });
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;  // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
