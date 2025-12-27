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

// In-memory state for offer timeouts: sos_id -> timeout handle
// Offer window for driver to accept/reject (milliseconds)
const OFFER_TIMEOUT_MS = 20000;  // 20 seconds
const _offerTimeouts = new Map();

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
      // new workflow: awaiting_driver_response while drivers are polled
      status: 'awaiting_driver_response',
      assigned_driver_id: null,
      assigned_hospital_id: null,
      // candidate and rejected lists
      current_driver_candidate: null,
      rejected_drivers: [],
      request_sent_at: null,
      created_at: new Date(),
      cancelled_before_pickup: false
    });

    await sosDoc.save();

    // Build a prioritized candidate queue (nearest first) and offer to the
    // first driver only. Do this asynchronously and do not fail the request
    (async () => {
      try {
        const queue = await buildCandidateQueue(sosDoc);
        if (queue && queue.length > 0) {
          const first = Number(queue[0]);
          const remaining = queue.slice(1).map(Number);
          // Atomically set initial candidate and remaining queue
          const updated = await SosRequest
                              .findOneAndUpdate(
                                  {
                                    sos_id: sosDoc.sos_id,
                                    status: 'awaiting_driver_response'
                                  },
                                  {
                                    $set: {
                                      current_driver_candidate: first,
                                      request_sent_at: new Date(),
                                      candidate_queue: remaining
                                    }
                                  },
                                  {new: true})
                              .lean();

          if (updated) {
            // schedule timeout for the offered driver
            clearOfferTimeoutForSos(updated.sos_id);
            const to = setTimeout(() => {
              autoRejectCandidate(updated.sos_id, Number(first))
                  .catch((err) => console.error('Auto-reject error', err));
            }, OFFER_TIMEOUT_MS);
            _offerTimeouts.set(updated.sos_id, to);
          }
        }
      } catch (err) {
        console.error('Offer error (non-fatal):', err);
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
    if (sos.status === 'awaiting_driver' ||
        sos.status === 'awaiting_driver_response')
      return res.json({status: 'awaiting_driver'});

    if (sos.status === 'driver_arrived') {
      const driverId = sos.assigned_driver_id;
      let driver = null;
      let live = null;
      if (driverId !== undefined && driverId !== null) {
        driver =
            await AmbulanceDriver.findOne({driver_id: Number(driverId)}).lean();
        try {
          live =
              await AmbulanceLiveLocation.findOne({driver_id: Number(driverId)})
                  .lean();
        } catch (err) {
          console.error(
              'Error fetching live location for status response', err);
          live = null;
        }
      }

      return res.json({
        status: 'driver_arrived',
        driver_name: driver ? `${(driver.first_name || '').trim()} ${
                                  (driver.last_name || '').trim()}`
                                  .trim() :
                              null,
        vehicle_number: driver ? driver.vehicle_number : null,
        assigned_hospital_id: sos.assigned_hospital_id || null,
        eta: 0,
        driver_latitude: live && live.latitude !== undefined ? live.latitude :
                                                               null,
        driver_longitude:
            live && live.longitude !== undefined ? live.longitude : null,
        severity: sos.severity || 'unknown'
      });
    }

    if (sos.status === 'assigned') {
      const driverId = sos.assigned_driver_id;
      let driver = null;
      let live = null;
      if (driverId !== undefined && driverId !== null) {
        driver =
            await AmbulanceDriver.findOne({driver_id: Number(driverId)}).lean();
        try {
          live =
              await AmbulanceLiveLocation.findOne({driver_id: Number(driverId)})
                  .lean();
        } catch (err) {
          // non-fatal: missing live location is allowed
          console.error(
              'Error fetching live location for status response', err);
          live = null;
        }
      }

      return res.json({
        status: 'assigned',
        driver_name: driver ? `${(driver.first_name || '').trim()} ${
                                  (driver.last_name || '').trim()}`
                                  .trim() :
                              null,
        vehicle_number: driver ? driver.vehicle_number : null,
        assigned_hospital_id: sos.assigned_hospital_id || null,
        eta: sos.eta_minutes || 10,
        severity: sos.severity || 'unknown',
        driver_latitude: live && live.latitude !== undefined ? live.latitude :
                                                               null,
        driver_longitude:
            live && live.longitude !== undefined ? live.longitude : null
      });
    }

    if (sos.status === 'cancelled' || sos.status === 'completed')
      return res.json(
          {status: sos.status, severity: sos.severity || 'unknown'});

    return res.json({status: sos.status || 'unknown'});
  } catch (err) {
    console.error('Error fetching SOS status (POST):', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// POST /sos/driver-arrived
// Body: { sos_id: Number, driver_id: Number }
router.post('/driver-arrived', async (req, res) => {
  try {
    const {sos_id, driver_id} = req.body;

    const missing = [];
    if (sos_id === undefined || sos_id === null) missing.push('sos_id');
    if (driver_id === undefined || driver_id === null)
      missing.push('driver_id');
    if (missing.length)
      return res.status(400).json(
          {status: 'fail', message: `missing_fields: ${missing.join(', ')}`});

    const sosIdNum = Number(sos_id);
    const driverIdNum = Number(driver_id);
    if (isNaN(sosIdNum) || isNaN(driverIdNum))
      return res.status(400).json(
          {status: 'fail', message: 'sos_id_and_driver_id_must_be_numbers'});

    // Ensure SOS exists
    const sos = await SosRequest.findOne({sos_id: sosIdNum});
    if (!sos) return res.json({status: 'sos_not_found'});

    // Ensure SOS is currently assigned
    if (sos.status !== 'assigned')
      return res.json({status: 'fail', message: 'sos_not_assigned'});

    // Ensure assigned driver matches
    if (Number(sos.assigned_driver_id) !== Number(driverIdNum))
      return res.json({status: 'fail', message: 'driver_mismatch'});

    // Atomically update status and arrived_at
    const updated = await SosRequest.findOneAndUpdate(
        {sos_id: sosIdNum, status: 'assigned', assigned_driver_id: driverIdNum},
        {$set: {status: 'driver_arrived', arrived_at: new Date()}},
        {new: true});

    if (!updated) {
      // If update failed for concurrency reasons, return server error
      return res.status(500).json({status: 'error', message: 'server_error'});
    }

    return res.json({
      status: 'success',
      message: 'driver_marked_arrived',
      sos_id: sosIdNum,
      driver_id: driverIdNum
    });
  } catch (err) {
    console.error('Error in /sos/driver-arrived:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// POST /sos/severity
// Body: { driver_id: Number, patient_id: Number, sos_id: Number, severity:
// String }
router.post('/severity', async (req, res) => {
  try {
    const {driver_id, patient_id, sos_id, severity} = req.body;

    const missing = [];
    if (driver_id === undefined || driver_id === null)
      missing.push('driver_id');
    if (patient_id === undefined || patient_id === null)
      missing.push('patient_id');
    if (sos_id === undefined || sos_id === null) missing.push('sos_id');
    if (severity === undefined || severity === null) missing.push('severity');
    if (missing.length)
      return res.status(400).json(
          {status: 'error', message: `missing_fields: ${missing.join(', ')}`});

    const driverIdNum = Number(driver_id);
    const patientIdNum = Number(patient_id);
    const sosIdNum = Number(sos_id);
    if (isNaN(driverIdNum) || isNaN(patientIdNum) || isNaN(sosIdNum))
      return res.status(400).json(
          {status: 'error', message: 'ids_must_be_numbers'});

    const VALID_SEVERITIES = ['critical', 'severe', 'moderate', 'mild'];
    if (!VALID_SEVERITIES.includes(String(severity)))
      return res.status(400).json(
          {status: 'error', message: 'invalid_severity'});

    // Find SOS
    const sos = await SosRequest.findOne({sos_id: sosIdNum});
    if (!sos) return res.json({status: 'error', message: 'sos_not_found'});

    // Verify ownership and assigned driver
    if (Number(sos.patient_id) !== patientIdNum ||
        Number(sos.assigned_driver_id) !== driverIdNum) {
      return res.json({status: 'error', message: 'unauthorized_driver'});
    }

    // Allow update only when status is 'assigned' or 'pending'
    if (!(sos.status === 'assigned' || sos.status === 'pending')) {
      return res.json({status: 'error', message: 'cannot_update_severity'});
    }

    // Update severity and persist
    sos.severity = String(severity);
    await sos.save();

    return res.json({
      status: 'success',
      message: 'severity_updated',
      sos_id: sosIdNum,
      severity: sos.severity
    });
  } catch (err) {
    console.error('Error in /sos/severity:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// --- Assignment helper -------------------------------------------------
// Find nearest active driver with a live location and atomically assign
async function assignNearestDriver(sos) {
  // Deprecated in new flow; keep as fallback (no-op)
  return null;
}

// Find nearest active driver not in excluded list. Returns {driver, live,
// distKm} or null
async function findNearestDriverExcluding(sos, excluded) {
  if (!sos || typeof sos.latitude !== 'number' ||
      typeof sos.longitude !== 'number')
    throw new Error('invalid_sos_coordinates');

  const drivers = await AmbulanceDriver.find({is_active: true}).lean();
  if (!drivers || drivers.length === 0) return null;

  const candidates = [];
  for (const d of drivers) {
    if (excluded && excluded.includes(d.driver_id)) continue;
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
  candidates.sort((a, b) => a.distKm - b.distKm);
  return candidates[0];
}

// Build an ordered candidate queue (driver IDs) nearest-first for the SOS
async function buildCandidateQueue(sos) {
  if (!sos || typeof sos.latitude !== 'number' ||
      typeof sos.longitude !== 'number')
    throw new Error('invalid_sos_coordinates');

  const drivers = await AmbulanceDriver.find({is_active: true}).lean();
  if (!drivers || drivers.length === 0) return [];

  const candidates = [];
  for (const d of drivers) {
    try {
      const live =
          await AmbulanceLiveLocation.findOne({driver_id: d.driver_id}).lean();
      if (!live || live.latitude === undefined || live.longitude === undefined)
        continue;
      const distKm = haversineDistanceKm(
          sos.latitude, sos.longitude, live.latitude, live.longitude);
      candidates.push({driverId: d.driver_id, distKm});
    } catch (err) {
      console.error(
          'Error fetching live location for driver', d.driver_id, err);
      continue;
    }
  }

  if (candidates.length === 0) return [];
  candidates.sort((a, b) => a.distKm - b.distKm);
  return candidates.map((c) => Number(c.driverId));
}

// Atomically offer an SOS to a driver by setting current_driver_candidate and
// removing the driver from the candidate_queue so they are not offered again.
async function offerSosToDriverAtomic(sos, driverId) {
  try {
    const updated = await SosRequest
                        .findOneAndUpdate(
                            {
                              sos_id: sos.sos_id,
                              status: 'awaiting_driver_response',
                              current_driver_candidate: null
                            },
                            {
                              $set: {
                                current_driver_candidate: Number(driverId),
                                request_sent_at: new Date()
                              },
                              // remove driver from queue anywhere in the list
                              $pull: {candidate_queue: Number(driverId)}
                            },
                            {new: true})
                        .lean();

    if (updated) {
      // schedule auto-reject if driver doesn't respond
      clearOfferTimeoutForSos(sos.sos_id);
      const to = setTimeout(() => {
        autoRejectCandidate(sos.sos_id, Number(driverId))
            .catch((err) => console.error('Auto-reject error', err));
      }, OFFER_TIMEOUT_MS);
      _offerTimeouts.set(sos.sos_id, to);
    }

    return updated;
  } catch (err) {
    console.error('Error offering SOS to driver atomically:', err);
    return null;
  }
}

function clearOfferTimeoutForSos(sosId) {
  try {
    const t = _offerTimeouts.get(sosId);
    if (t) {
      clearTimeout(t);
      _offerTimeouts.delete(sosId);
    }
  } catch (err) {
    console.error('Error clearing offer timeout for sos', sosId, err);
  }
}

// Check whether the current offer for a given SOS is active for a driver
function isOfferActiveForDriver(sos, driverId) {
  try {
    if (!sos || sos.current_driver_candidate === undefined ||
        sos.current_driver_candidate === null)
      return false;
    if (Number(sos.current_driver_candidate) !== Number(driverId)) return false;
    if (!sos.request_sent_at) return false;
    const sent = new Date(sos.request_sent_at).getTime();
    if (isNaN(sent)) return false;
    const now = Date.now();
    return now - sent <= OFFER_TIMEOUT_MS;
  } catch (err) {
    console.error('Error in isOfferActiveForDriver:', err);
    return false;
  }
}

async function autoRejectCandidate(sosId, driverId) {
  // Atomically add driver to rejected_drivers and clear candidate if still the
  // same
  try {
    const sos = await SosRequest.findOne({sos_id: sosId});
    if (!sos) return;

    // If current candidate is not the timed-out driver, nothing to do
    if (sos.current_driver_candidate !== Number(driverId)) return;

    // Add to rejected list and clear candidate
    sos.rejected_drivers =
        Array.isArray(sos.rejected_drivers) ? sos.rejected_drivers : [];
    if (!sos.rejected_drivers.includes(Number(driverId)))
      sos.rejected_drivers.push(Number(driverId));
    sos.current_driver_candidate = null;
    sos.request_sent_at = null;
    await sos.save();
    clearOfferTimeoutForSos(sosId);

    // Next candidate from precomputed queue (if any)
    const nextCandidate =
        Array.isArray(sos.candidate_queue) && sos.candidate_queue.length > 0 ?
        sos.candidate_queue[0] :
        null;
    if (nextCandidate) {
      await offerSosToDriverAtomic(sos, Number(nextCandidate));
    } else {
      // No remaining candidates — log and keep SOS awaiting (no drivers
      // accepted)
      console.warn('No remaining drivers for SOS', sosId);
    }
  } catch (err) {
    console.error('Error in autoRejectCandidate:', err);
  }
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

// --- Background poller -------------------------------------------------
// Periodically check for pending SOS requests (status='pending' and
// assigned_driver_id=null) and attempt assignment. Runs every 2 seconds.
let _pendingSosPollRunning = false;
async function pollPendingSosAndAssign() {
  if (_pendingSosPollRunning) return;
  _pendingSosPollRunning = true;
  try {
    const pendings = await SosRequest
                         .find({
                           status: 'awaiting_driver_response',
                           current_driver_candidate: null
                         })
                         .lean();
    if (!pendings || pendings.length === 0) {
      _pendingSosPollRunning = false;
      return;
    }

    for (const s of pendings) {
      try {
        // Offer to nearest driver not already rejected
        const next =
            await findNearestDriverExcluding(s, s.rejected_drivers || []);
        if (next) await offerSosToDriverAtomic(s, next.driver.driver_id);
      } catch (err) {
        console.error('Error attempting offer for pending SOS', s.sos_id, err);
      }
    }
  } catch (err) {
    console.error('Error polling pending SOS requests:', err);
  } finally {
    _pendingSosPollRunning = false;
  }
}

// Start poller when this module is loaded
const SOS_POLL_INTERVAL_MS = 2000;
const _sosPollInterval = setInterval(() => {
  pollPendingSosAndAssign().catch(
      (err) => console.error('Poller fatal error', err));
}, SOS_POLL_INTERVAL_MS);

// Optional: gracefully clear interval on process exit
process.on('SIGINT', () => {
  clearInterval(_sosPollInterval);
  process.exit();
});

// Expose helper functions for driver route usage
router.offerSosToDriverAtomic = offerSosToDriverAtomic;
router.clearOfferTimeoutForSos = clearOfferTimeoutForSos;
router.findNearestDriverExcluding = findNearestDriverExcluding;
router.buildCandidateQueue = buildCandidateQueue;
router.isOfferActiveForDriver = isOfferActiveForDriver;

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

    // Only pending, awaiting_driver (legacy), awaiting_driver_response,
    // assigned, or driver_arrived can be cancelled
    if (sos.status === 'pending' || sos.status === 'awaiting_driver' ||
        sos.status === 'awaiting_driver_response' ||
        sos.status === 'assigned' || sos.status === 'driver_arrived') {
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
