const express = require('express');
const router = express.Router();

const SosRequest = require('../models/SosRequest');
const AmbulanceDriver = require('../models/AmbulanceDriver');
const AmbulanceLiveLocation = require('../models/AmbulanceLiveLocation');
const AmbulanceAssignment = require('../models/AmbulanceAssignment');
const sosController = require('../controllers/sosController');
const firebaseAdmin = require('../config/firebase');
const Hospital = require('../models/Hospital');
const https = require('https');
const {URL} = require('url');

// ============================================
// Admin Dashboard Routes (Controller-based)
// ============================================

// GET /sos/summary - Get SOS requests summary counts
router.get('/summary', sosController.getSosSummary);

// GET /sos/recent - Get recent SOS requests list
router.get('/recent', sosController.getRecentSosRequests);

// GET /sos/severity - Get SOS breakdown by severity
router.get('/severity', sosController.getSosBySeverity);

// GET /sos/trend - Get hourly SOS trend for last 24 hours
router.get('/trend', sosController.getSosTrend);

// ============================================
// Existing Routes
// ============================================

// Helper: allowed severity values come from the schema
const ALLOWED_SEVERITIES =
    ['critical', 'severe', 'moderate', 'mild', 'unknown'];

// In-memory state for offer timeouts: sos_id -> timeout handle
// Offer window for driver to accept/reject (milliseconds)
const OFFER_TIMEOUT_MS = 40000;  // 30 seconds
const _offerTimeouts = new Map();

// ============================================
// FCM Push Notification Helper
// ============================================

/**
 * Send FCM push notification to a candidate driver for an SOS request.
 * Only sends to one driver at a time (the current candidate).
 * @param {Number} driverId - The driver's ID
 * @param {Object} sosData - SOS request data (sos_id, patient_id, latitude,
 *     longitude)
 * @returns {Promise<boolean>} - true if sent successfully, false otherwise
 */
async function sendSosNotificationToDriver(driverId, sosData) {
  try {
    // Check if Firebase is initialized
    if (!firebaseAdmin || !firebaseAdmin.apps ||
        firebaseAdmin.apps.length === 0) {
      console.warn(
          'FCM: Firebase Admin not initialized, skipping notification');
      return false;
    }

    // Get driver's FCM token
    const driver =
        await AmbulanceDriver.findOne({driver_id: Number(driverId)}).lean();
    if (!driver) {
      console.error(`FCM: Driver ${driverId} not found`);
      return false;
    }

    if (!driver.fcm_token) {
      console.warn(
          `FCM: Driver ${driverId} has no FCM token, skipping notification`);
      return false;
    }

    // Calculate distance from driver's current location to patient
    let distanceKm = null;
    let driverLatitude = null;
    let driverLongitude = null;
    try {
      const driverLocation =
          await AmbulanceLiveLocation.findOne({driver_id: Number(driverId)})
              .lean();
      if (driverLocation && driverLocation.latitude &&
          driverLocation.longitude) {
        driverLatitude = driverLocation.latitude;
        driverLongitude = driverLocation.longitude;
        distanceKm = haversineDistanceKm(
            driverLocation.latitude, driverLocation.longitude, sosData.latitude,
            sosData.longitude);
        distanceKm =
            Math.round(distanceKm * 100) / 100;  // Round to 2 decimal places
      }
    } catch (locErr) {
      console.error(
          `FCM: Error getting driver location for distance calc:`, locErr);
    }

    // Log FCM SOS payload details
    console.log('FCM SOS payload:', {
      driver_id: driverId,
      driver_latitude: driverLatitude,
      driver_longitude: driverLongitude,
      patient_latitude: sosData.latitude,
      patient_longitude: sosData.longitude,
      distance_km: distanceKm
    });

    // Build FCM message
    const message = {
      token: driver.fcm_token,
      notification: {
        title: 'Emergency SOS Request',
        body: 'New emergency nearby. Tap to accept or reject.'
      },
      data: {
        type: 'SOS_REQUEST',
        sos_id: String(sosData.sos_id),
        patient_id: String(sosData.patient_id),
        patient_latitude: String(sosData.latitude),
        patient_longitude: String(sosData.longitude),
        distance_km: distanceKm !== null ? String(distanceKm) : 'unknown'
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'sos_alerts',
          priority: 'max',
          defaultSound: true,
          defaultVibrateTimings: true
        }
      }
    };

    // Send FCM notification
    const response = await firebaseAdmin.messaging().send(message);
    console.log(`FCM: Successfully sent SOS notification to driver ${
        driverId}, messageId: ${response}`);
    return true;

  } catch (error) {
    // Handle specific FCM errors
    if (error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token') {
      console.warn(
          `FCM: Driver ${driverId} has invalid/expired token, clearing it`);
      // Clear the invalid token
      try {
        await AmbulanceDriver.updateOne(
            {driver_id: Number(driverId)},
            {$set: {fcm_token: null, token_last_update: null}});
      } catch (updateErr) {
        console.error('FCM: Error clearing invalid token:', updateErr);
      }
    } else {
      console.error(
          `FCM: Error sending notification to driver ${driverId}:`,
          error.message || error);
    }
    return false;
  }
}

// Forward declaration for haversineDistanceKm (defined later in file)
// This allows the FCM helper to use it

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
            // Send FCM push notification to the first candidate driver
            await sendSosNotificationToDriver(first, {
              sos_id: updated.sos_id,
              patient_id: updated.patient_id,
              latitude: updated.latitude,
              longitude: updated.longitude
            });

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

    // Allow update only when status is 'assigned', 'pending' or
    // 'driver_arrived'
    if (!(sos.status === 'assigned' || sos.status === 'pending' ||
          sos.status === 'driver_arrived')) {
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

// POST /sos/assign-hospital
// Body: { sos_id: Number, patient_id: Number, driver_id: Number, latitude:
// Number, longitude: Number, severity: String } Assigns the best hospital based
// on severity and rush level
router.post('/assign-hospital', async (req, res) => {
  try {
    const {sos_id, patient_id, driver_id, latitude, longitude, severity} =
        req.body;

    // Validate required fields
    const missing = [];
    if (sos_id === undefined || sos_id === null) missing.push('sos_id');
    if (patient_id === undefined || patient_id === null)
      missing.push('patient_id');
    if (driver_id === undefined || driver_id === null)
      missing.push('driver_id');
    if (latitude === undefined || latitude === null) missing.push('latitude');
    if (longitude === undefined || longitude === null)
      missing.push('longitude');
    if (severity === undefined || severity === null) missing.push('severity');
    if (missing.length) {
      return res.status(400).json(
          {status: 'fail', message: 'missing_fields', missing});
    }

    // Convert and validate numeric fields
    const sosIdNum = Number(sos_id);
    const patientIdNum = Number(patient_id);
    const driverIdNum = Number(driver_id);
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(sosIdNum) || isNaN(patientIdNum) || isNaN(driverIdNum)) {
      return res.status(400).json(
          {status: 'fail', message: 'ids_must_be_numbers'});
    }
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 ||
        lon > 180) {
      return res.status(400).json(
          {status: 'fail', message: 'invalid_coordinates'});
    }

    // Validate severity
    const VALID_SEVERITIES = ['critical', 'severe', 'moderate', 'mild'];
    if (!VALID_SEVERITIES.includes(String(severity))) {
      return res.status(400).json(
          {status: 'fail', message: 'invalid_severity'});
    }

    // Find SOS request
    const sos = await SosRequest.findOne({sos_id: sosIdNum});
    if (!sos) {
      return res.status(404).json({status: 'fail', message: 'sos_not_found'});
    }

    // Check if SOS is cancelled
    if (sos.status === 'cancelled') {
      return res.status(400).json(
          {status: 'fail', message: 'sos_is_cancelled'});
    }

    // Check if driver has arrived (arrived_at must not be null)
    if (!sos.arrived_at) {
      return res.status(400).json(
          {status: 'fail', message: 'driver_not_arrived_yet'});
    }

    // Verify patient ownership
    if (Number(sos.patient_id) !== patientIdNum) {
      return res.status(403).json(
          {status: 'fail', message: 'patient_mismatch'});
    }

    // Verify assigned driver
    if (Number(sos.assigned_driver_id) !== driverIdNum) {
      return res.status(403).json({status: 'fail', message: 'driver_mismatch'});
    }

    // Check if hospital already assigned
    if (sos.assigned_hospital_id) {
      const existingHospital =
          await Hospital.findOne({hospital_id: sos.assigned_hospital_id})
              .lean();
      if (existingHospital) {
        return res.json({
          status: 'success',
          message: 'hospital_already_assigned',
          hospital_id: existingHospital.hospital_id,
          hospital_name: existingHospital.name,
          hospital_address: existingHospital.address || null,
          hospital_latitude: existingHospital.latitude,
          hospital_longitude: existingHospital.longitude,
          rush_level: existingHospital.rush_level
        });
      }
    }

    // Rush level priority (lower is better for selection)
    const RUSH_PRIORITY = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4};

    // Get all hospitals with coordinates
    const allHospitals = await Hospital
                             .find({
                               latitude: {$exists: true, $ne: null},
                               longitude: {$exists: true, $ne: null}
                             })
                             .lean();

    if (!allHospitals || allHospitals.length === 0) {
      return res.status(404).json(
          {status: 'fail', message: 'no_hospitals_available'});
    }

    // Calculate distance for each hospital from driver's current location
    let hospitalsWithDistance = allHospitals.map(h => {
      const distKm = haversineDistanceKm(lat, lon, h.latitude, h.longitude);
      return {
        ...h,
        distance_km: Math.round(distKm * 100) / 100,
        rush_priority: RUSH_PRIORITY[h.rush_level] || 2
      };
    });

    // Sort by distance (nearest first)
    hospitalsWithDistance.sort((a, b) => a.distance_km - b.distance_km);

    // Initial radius for filtering
    let radius = 15;  // km
    let selectedHospital = null;

    // Helper function to select hospital based on criteria
    const selectHospital = (candidates, severityLevel) => {
      if (!candidates || candidates.length === 0) return null;

      switch (severityLevel) {
        case 'critical':
          // Critical: Just pick the nearest hospital regardless of rush
          return candidates[0];

        case 'severe':
          // Severe: From 5 nearest, pick one with rush < critical
          // But prefer nearer even with higher rush
          // Sort by: distance first, then by rush (but only consider rush <
          // critical)
          const severe5 = candidates.slice(0, 5);
          // Filter out critical rush hospitals
          const severeNonCritical =
              severe5.filter(h => h.rush_level !== 'critical');
          if (severeNonCritical.length > 0) {
            // Return the nearest among non-critical rush
            return severeNonCritical[0];
          }
          // If all are critical rush, return nearest anyway
          return severe5[0];

        case 'moderate':
          // Moderate: From 10 nearest, pick one with low/medium rush, prefer
          // nearest
          const mod10 = candidates.slice(0, 10);
          // Filter for low or medium rush
          const modLowMed = mod10.filter(
              h => h.rush_level === 'low' || h.rush_level === 'medium');
          if (modLowMed.length > 0) {
            // Sort by distance first (already sorted), then by rush_priority
            modLowMed.sort((a, b) => {
              // Weight distance more than rush: distance difference * 2 vs
              // rush_priority difference
              const distDiff = a.distance_km - b.distance_km;
              const rushDiff = a.rush_priority - b.rush_priority;
              // If distance difference is small (<1km), prefer lower rush
              if (Math.abs(distDiff) < 1) {
                return rushDiff !== 0 ? rushDiff : distDiff;
              }
              return distDiff;
            });
            return modLowMed[0];
          }
          // If none with low/medium, try high rush (avoid critical)
          const modNonCritical = mod10.filter(h => h.rush_level !== 'critical');
          if (modNonCritical.length > 0) return modNonCritical[0];
          // Fallback to nearest
          return mod10[0];

        case 'mild':
          // Mild: All within radius, pick lowest rush + nearest
          // Sort by rush_priority first, then distance
          const mildSorted = [...candidates].sort((a, b) => {
            const rushDiff = a.rush_priority - b.rush_priority;
            if (rushDiff !== 0) return rushDiff;
            return a.distance_km - b.distance_km;
          });
          return mildSorted[0];

        default:
          return candidates[0];
      }
    };

    // Try to find hospitals within radius, expand if needed
    while (!selectedHospital) {
      const withinRadius =
          hospitalsWithDistance.filter(h => h.distance_km <= radius);

      if (withinRadius.length > 0) {
        selectedHospital = selectHospital(withinRadius, severity);
      }

      if (!selectedHospital) {
        // Expand radius by 10km
        radius += 10;
        // Safety limit: if radius exceeds 200km, just pick nearest
        if (radius > 200) {
          selectedHospital = hospitalsWithDistance[0];
          break;
        }
      }
    }

    if (!selectedHospital) {
      return res.status(404).json(
          {status: 'fail', message: 'no_suitable_hospital_found'});
    }

    // Calculate estimated time to reach hospital (assuming avg 40 km/h for
    // ambulance in urban traffic) For critical cases, assume faster speed (60
    // km/h) due to emergency driving
    const avgSpeedKmh = severity === 'critical' ? 60 : 40;
    const estimatedTimeMinutes =
        Math.ceil((selectedHospital.distance_km / avgSpeedKmh) * 60);

    // Update SOS with assigned hospital and ETA
    sos.assigned_hospital_id = selectedHospital.hospital_id;
    sos.severity = severity;  // Update severity as well
    sos.eta_minutes = estimatedTimeMinutes;
    await sos.save();

    return res.json({
      status: 'success',
      message: 'hospital_assigned',
      sos_id: sosIdNum,
      hospital_id: selectedHospital.hospital_id,
      hospital_name: selectedHospital.name,
      hospital_address: selectedHospital.address || null,
      hospital_latitude: selectedHospital.latitude,
      hospital_longitude: selectedHospital.longitude,
      distance_km: selectedHospital.distance_km,
      estimated_time_minutes: estimatedTimeMinutes,
      rush_level: selectedHospital.rush_level,
      severity: severity
    });

  } catch (err) {
    console.error('Error in /sos/assign-hospital:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// POST /sos/check-hospital-assignment
// Body: { sos_id: Number, patient_id: Number }
// For patient app to poll and check if a hospital has been assigned
router.post('/check-hospital-assignment', async (req, res) => {
  try {
    const {sos_id, patient_id} = req.body;

    // Validate required fields
    const missing = [];
    if (sos_id === undefined || sos_id === null) missing.push('sos_id');
    if (patient_id === undefined || patient_id === null)
      missing.push('patient_id');
    if (missing.length) {
      return res.status(400).json(
          {status: 'fail', message: 'missing_fields', missing});
    }

    const sosIdNum = Number(sos_id);
    const patientIdNum = Number(patient_id);

    if (isNaN(sosIdNum) || isNaN(patientIdNum)) {
      return res.status(400).json(
          {status: 'fail', message: 'ids_must_be_numbers'});
    }

    // Find SOS request
    const sos = await SosRequest.findOne({sos_id: sosIdNum}).lean();
    if (!sos) {
      return res.status(404).json({status: 'fail', message: 'sos_not_found'});
    }

    // Verify patient ownership
    if (Number(sos.patient_id) !== patientIdNum) {
      return res.status(403).json(
          {status: 'fail', message: 'not_request_owner'});
    }

    // Check SOS status
    if (sos.status === 'cancelled') {
      return res.json({status: 'cancelled', message: 'sos_was_cancelled'});
    }

    // Check if hospital is assigned
    if (!sos.assigned_hospital_id) {
      return res.json({
        status: 'not_assigned',
        sos_status: sos.status,
        severity: sos.severity || 'unknown'
      });
    }

    // Hospital is assigned - fetch hospital details
    const hospital =
        await Hospital.findOne({hospital_id: sos.assigned_hospital_id}).lean();

    if (!hospital) {
      return res.json({
        status: 'assigned',
        hospital_id: sos.assigned_hospital_id,
        hospital_name: null,
        hospital_address: null,
        hospital_latitude: null,
        hospital_longitude: null,
        rush_level: null,
        eta_minutes: sos.eta_minutes || null,
        severity: sos.severity || 'unknown',
        sos_status: sos.status
      });
    }

    return res.json({
      status: 'assigned',
      hospital_id: hospital.hospital_id,
      hospital_name: hospital.name,
      hospital_address: hospital.address || null,
      hospital_latitude: hospital.latitude,
      hospital_longitude: hospital.longitude,
      rush_level: hospital.rush_level,
      eta_minutes: sos.eta_minutes || null,
      severity: sos.severity || 'unknown',
      sos_status: sos.status
    });

  } catch (err) {
    console.error('Error in /sos/check-hospital-assignment:', err);
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
      // Send FCM push notification to the new candidate driver
      await sendSosNotificationToDriver(driverId, {
        sos_id: updated.sos_id,
        patient_id: updated.patient_id,
        latitude: updated.latitude,
        longitude: updated.longitude
      });

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
