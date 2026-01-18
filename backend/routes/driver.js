const router = require('express').Router();
const AmbulanceDriver = require('../models/AmbulanceDriver');
const AmbulanceLiveLocation = require('../models/AmbulanceLiveLocation');
const AmbulanceAssignment = require('../models/AmbulanceAssignment');
const SosRequest = require('../models/SosRequest');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const sosRoutes = require('./sos');
const https = require('https');
const {URL} = require('url');

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
// Note: router has been extended by sos routes with helper methods

// --- Driver SOS polling/accept/reject endpoints -------------------------
// POST /driver/sos/check
// Body: { driver_id: Number }
router.post('/sos/check', async (req, res) => {
  try {
    const {driver_id} = req.body;
    if (driver_id === undefined || driver_id === null)
      return res.status(400).json(
          {status: 'fail', message: 'missing_field: driver_id'});

    const driverIdNum = Number(driver_id);
    if (isNaN(driverIdNum))
      return res.status(400).json(
          {status: 'fail', message: 'driver_id_must_be_number'});

    const sos = await SosRequest
                    .findOne({
                      status: 'awaiting_driver_response',
                      current_driver_candidate: driverIdNum
                    })
                    .lean();
    if (!sos) return res.json({status: 'no_request'});

    // Ensure the offer is still active (within offer timeout window). This
    // prevents cases where the candidate rotated quickly and multiple
    // drivers see 'incoming' simultaneously.
    try {
      if (sosRoutes && typeof sosRoutes.isOfferActiveForDriver === 'function') {
        const active = sosRoutes.isOfferActiveForDriver(sos, driverIdNum);
        if (!active) return res.json({status: 'no_request'});
      }
    } catch (e) {
      console.error('Error validating offer activity for driver:', e);
      return res.json({status: 'no_request'});
    }

    const patient = await User.findOne({user_id: sos.patient_id}).lean();
    const patientName = patient ?
        ((patient.last_name && String(patient.last_name).trim()) ?
             `${(patient.first_name || '').trim()} ${
                 (patient.last_name || '').trim()}`
                 .trim() :
             (patient.first_name || '').trim()) :
        null;

    return res.json({
      status: 'incoming',
      sos_id: sos.sos_id,
      patient_id: sos.patient_id,
      patient_name: patientName,
      latitude: sos.latitude,
      longitude: sos.longitude
    });
  } catch (err) {
    console.error('Error in /driver/sos/check:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// POST /driver/sos/accept
// Body: { driver_id: Number, sos_id: Number }
router.post('/sos/accept', async (req, res) => {
  try {
    const {driver_id, sos_id} = req.body;
    const missing = [];
    if (driver_id === undefined || driver_id === null)
      missing.push('driver_id');
    if (sos_id === undefined || sos_id === null) missing.push('sos_id');
    if (missing.length)
      return res.status(400).json(
          {status: 'fail', message: `missing_fields: ${missing.join(', ')}`});

    const driverIdNum = Number(driver_id);
    const sosIdNum = Number(sos_id);
    if (isNaN(driverIdNum) || isNaN(sosIdNum))
      return res.status(400).json(
          {status: 'fail', message: 'driver_id_and_sos_id_must_be_numbers'});

    // Atomically accept only if driver is current candidate
    const updated = await SosRequest
                        .findOneAndUpdate(
                            {
                              sos_id: sosIdNum,
                              status: 'awaiting_driver_response',
                              current_driver_candidate: driverIdNum
                            },
                            {
                              $set: {
                                status: 'assigned',
                                assigned_driver_id: driverIdNum,
                                assigned_hospital_id: null,
                                assigned_at: new Date()
                              }
                            },
                            {new: true})
                        .lean();

    if (!updated)
      return res.status(409).json({
        status: 'fail',
        message: 'not_current_candidate_or_already_handled'
      });

    try {
      await AmbulanceAssignment.findOneAndUpdate(
          {sos_id: sosIdNum}, {
            $setOnInsert: {
              assignment_id: Date.now(),
              sos_id: sosIdNum,
              driver_id: driverIdNum,
              assigned_hospital_id: updated.assigned_hospital_id || null,
              assigned_at: new Date()
            }
          },
          {upsert: true, new: true});
    } catch (err) {
      console.error('Error creating AmbulanceAssignment on accept:', err);
    }

    // stop timeout and offering
    try {
      if (sosRoutes && typeof sosRoutes.clearOfferTimeoutForSos === 'function')
        sosRoutes.clearOfferTimeoutForSos(sosIdNum);
    } catch (e) {
      console.error('Error clearing offer timeout on accept:', e);
    }

    return res.json({status: 'success', message: 'driver_accepted'});
  } catch (err) {
    console.error('Error in /driver/sos/accept:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// POST /driver/sos/reject
// Body: { driver_id: Number, sos_id: Number }
router.post('/sos/reject', async (req, res) => {
  try {
    const {driver_id, sos_id} = req.body;
    const missing = [];
    if (driver_id === undefined || driver_id === null)
      missing.push('driver_id');
    if (sos_id === undefined || sos_id === null) missing.push('sos_id');
    if (missing.length)
      return res.status(400).json(
          {status: 'fail', message: `missing_fields: ${missing.join(', ')}`});

    const driverIdNum = Number(driver_id);
    const sosIdNum = Number(sos_id);
    if (isNaN(driverIdNum) || isNaN(sosIdNum))
      return res.status(400).json(
          {status: 'fail', message: 'driver_id_and_sos_id_must_be_numbers'});

    const sos = await SosRequest.findOne({sos_id: sosIdNum});
    if (!sos)
      return res.status(404).json({status: 'fail', message: 'sos_not_found'});
    if (sos.status !== 'awaiting_driver_response')
      return res.status(409).json(
          {status: 'fail', message: 'sos_not_awaiting_driver'});

    // If driver is not currently candidate, still add to rejected list and
    // return
    if (sos.current_driver_candidate !== driverIdNum) {
      try {
        await SosRequest.findOneAndUpdate(
            {sos_id: sosIdNum}, {$addToSet: {rejected_drivers: driverIdNum}});
      } catch (err) {
        console.error('Error adding to rejected_drivers:', err);
      }
      return res.json({status: 'success', message: 'driver_rejected'});
    }

    // If driver is current candidate, atomically add to rejected list and clear
    // candidate
    const updated =
        await SosRequest
            .findOneAndUpdate(
                {
                  sos_id: sosIdNum,
                  status: 'awaiting_driver_response',
                  current_driver_candidate: driverIdNum
                },
                {
                  $addToSet: {rejected_drivers: driverIdNum},
                  $set: {current_driver_candidate: null, request_sent_at: null}
                },
                {new: true})
            .exec();

    try {
      if (sosRoutes && typeof sosRoutes.clearOfferTimeoutForSos === 'function')
        sosRoutes.clearOfferTimeoutForSos(sosIdNum);
    } catch (e) {
      console.error('Error clearing offer timeout on reject:', e);
    }

    // Offer to next candidate immediately
    try {
      const next = await sosRoutes.findNearestDriverExcluding(
          updated, updated.rejected_drivers || []);
      if (next)
        await sosRoutes.offerSosToDriverAtomic(updated, next.driver.driver_id);
    } catch (err) {
      console.error('Error finding/offering next candidate after reject:', err);
    }

    return res.json({status: 'success', message: 'driver_rejected'});
  } catch (err) {
    console.error('Error in /driver/sos/reject:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

// POST /driver/nearby
// Body: { latitude: Number, longitude: Number }
// Returns drivers within 10km radius with road distance from Google Maps
router.post('/nearby', async (req, res) => {
  try {
    const {latitude, longitude} = req.body;

    const missing = [];
    if (latitude === undefined || latitude === null) missing.push('latitude');
    if (longitude === undefined || longitude === null)
      missing.push('longitude');
    if (missing.length)
      return res.status(400).json(
          {status: 'fail', message: `missing_fields: ${missing.join(', ')}`});

    const lat = Number(latitude);
    const lon = Number(longitude);
    if (isNaN(lat) || isNaN(lon))
      return res.status(400).json(
          {status: 'fail', message: 'invalid_coordinates'});

    // Get all active (on-duty) drivers
    const activeDrivers = await AmbulanceDriver.find({is_active: true}).lean();
    if (!activeDrivers || activeDrivers.length === 0) {
      return res.json({status: 'success', total_drivers: 0, drivers: null});
    }

    // Get live locations for active drivers
    const driversWithLocation = [];
    for (const driver of activeDrivers) {
      try {
        const liveLocation =
            await AmbulanceLiveLocation.findOne({driver_id: driver.driver_id})
                .lean();
        if (liveLocation && liveLocation.latitude !== undefined &&
            liveLocation.longitude !== undefined) {
          driversWithLocation.push({
            driver,
            latitude: liveLocation.latitude,
            longitude: liveLocation.longitude
          });
        }
      } catch (err) {
        console.error(
            `Error fetching location for driver ${driver.driver_id}:`, err);
      }
    }

    if (driversWithLocation.length === 0) {
      return res.json({status: 'success', total_drivers: 0, drivers: null});
    }

    // Calculate distances using Google Distance Matrix API
    const nearbyDrivers = [];
    const RADIUS_KM = 10;

    for (const driverData of driversWithLocation) {
      try {
        const distanceKm = await getDistanceFromGoogle(
            lat, lon, driverData.latitude, driverData.longitude);

        if (distanceKm <= RADIUS_KM) {
          // Construct full name from first_name and last_name
          const fullName = `${(driverData.driver.first_name || '').trim()} ${
                               (driverData.driver.last_name || '').trim()}`
                               .trim() ||
              'Unknown Driver';

          nearbyDrivers.push({
            name: fullName,
            license_number: driverData.driver.license_number,
            distance_km:
                Math.round(distanceKm * 100) / 100  // Round to 2 decimal places
          });
        }
      } catch (err) {
        console.error(
            `Error calculating distance for driver ${
                driverData.driver.driver_id}:`,
            err);
        // Skip this driver if distance calculation fails
      }
    }

    if (nearbyDrivers.length === 0) {
      return res.json({status: 'success', total_drivers: 0, drivers: null});
    }

    // Sort by distance (nearest first)
    nearbyDrivers.sort((a, b) => a.distance_km - b.distance_km);

    return res.json({
      status: 'success',
      total_drivers: nearbyDrivers.length,
      drivers: nearbyDrivers
    });
  } catch (err) {
    console.error('Error in /driver/nearby:', err);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
});

/**
 * Get road distance in km from Google Distance Matrix API
 */
async function getDistanceFromGoogle(originLat, originLon, destLat, destLon) {
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
          if (!elem || elem.status !== 'OK' || !elem.distance ||
              !elem.distance.value) {
            return reject(new Error('No distance in Google response'));
          }
          const meters = Number(elem.distance.value);
          const km = meters / 1000;
          return resolve(km);
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

module.exports = router;
