const AmbulanceDriver = require('../models/AmbulanceDriver');
const AmbulanceAssignment = require('../models/AmbulanceAssignment');
const AmbulanceLiveLocation = require('../models/AmbulanceLiveLocation');
const HospitalAdmin = require('../models/HospitalAdmin');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const SosRequest = require('../models/SosRequest');

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Get all ambulance drivers near the admin's hospital district
 * Includes driver status and current assignment info
 */
exports.getDriversNearHospital = async (req, res) => {
    try {
        const { admin_id } = req.query;
        const maxDistanceKm = parseFloat(req.query.max_distance) || 50; // Default 50km radius

        if (!admin_id) {
            return res.status(400).json({
                status: 'fail',
                message: 'admin_id is required'
            });
        }

        // Find which hospital this admin manages
        const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });

        if (!adminRecord) {
            return res.status(404).json({
                status: 'fail',
                message: 'Admin not found or not assigned to any hospital'
            });
        }

        const hospitalId = adminRecord.hospital_id;
        if (!hospitalId) {
            return res.status(404).json({
                status: 'fail',
                message: 'Admin not assigned to any hospital'
            });
        }

        // Get the hospital details to get its location
        const hospital = await Hospital.findOne({ hospital_id: hospitalId });

        if (!hospital) {
            return res.status(404).json({
                status: 'fail',
                message: 'Hospital not found'
            });
        }

        // Get all ambulance drivers
        const allDrivers = await AmbulanceDriver.find({});

        // Get driver user details for name information
        const driverIds = allDrivers.map(d => d.driver_id);
        const driverUsers = await User.find({ user_id: { $in: driverIds } });
        const userMap = {};
        driverUsers.forEach(u => {
            userMap[u.user_id] = u;
        });

        // Get live locations for all drivers
        const liveLocations = await AmbulanceLiveLocation.find({ driver_id: { $in: driverIds } });
        const locationMap = {};
        liveLocations.forEach(loc => {
            locationMap[loc.driver_id] = loc;
        });

        // Get current active assignments for all drivers
        const activeAssignments = await AmbulanceAssignment.find({
            driver_id: { $in: driverIds },
            is_completed: false
        });
        const assignmentMap = {};
        activeAssignments.forEach(a => {
            assignmentMap[a.driver_id] = a;
        });

        // Get SOS request details for assignments
        const sosIds = activeAssignments.map(a => a.sos_id).filter(id => id);
        const sosRequests = await SosRequest.find({ sos_id: { $in: sosIds } });
        const sosMap = {};
        sosRequests.forEach(s => {
            sosMap[s.sos_id] = s;
        });

        // Get patient details for SOS requests
        const patientIds = sosRequests.map(s => s.patient_id).filter(id => id);
        const patients = await User.find({ user_id: { $in: patientIds } });
        const patientMap = {};
        patients.forEach(p => {
            patientMap[p.user_id] = p;
        });

        // Filter drivers near the hospital and build response
        const driversNearHospital = [];

        for (const driver of allDrivers) {
            const user = userMap[driver.driver_id];
            const location = locationMap[driver.driver_id];
            const assignment = assignmentMap[driver.driver_id];
            
            let distance = null;
            let isNearHospital = true; // Default to true if no location filter needed

            // If hospital has coordinates and driver has live location, calculate distance
            if (hospital.latitude && hospital.longitude && location) {
                distance = calculateDistance(
                    hospital.latitude,
                    hospital.longitude,
                    location.latitude,
                    location.longitude
                );
                isNearHospital = distance <= maxDistanceKm;
            }

            // Include all drivers for now (they might not have live location yet)
            // In production, you might want to filter only those with location
            
            // Build current assignment info
            let currentAssignment = null;
            if (assignment) {
                const sos = sosMap[assignment.sos_id];
                let patientName = 'Unknown Patient';
                if (sos && patientMap[sos.patient_id]) {
                    const patient = patientMap[sos.patient_id];
                    patientName = `${patient.first_name} ${patient.last_name || ''}`.trim();
                }
                currentAssignment = {
                    assignment_id: assignment.assignment_id,
                    sos_id: assignment.sos_id,
                    patient_name: patientName,
                    assigned_at: assignment.assigned_at,
                    eta: assignment.route_eta
                };
            }

            driversNearHospital.push({
                driver_id: driver.driver_id,
                first_name: driver.first_name || user?.first_name || 'Unknown',
                last_name: driver.last_name || user?.last_name || '',
                full_name: `${driver.first_name || user?.first_name || 'Unknown'} ${driver.last_name || user?.last_name || ''}`.trim(),
                license_number: driver.license_number,
                vehicle_number: driver.vehicle_number,
                is_active: driver.is_active,
                status: driver.is_active ? 'Active' : 'Inactive',
                last_login: user?.last_login || null,
                distance_km: distance ? parseFloat(distance.toFixed(2)) : null,
                last_location: location ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    updated_at: location.updated_at
                } : null,
                current_assignment: currentAssignment
            });
        }

        // Sort by status (active first) then by distance
        driversNearHospital.sort((a, b) => {
            // Active drivers first
            if (a.is_active !== b.is_active) {
                return b.is_active - a.is_active;
            }
            // Then by distance (if available)
            if (a.distance_km !== null && b.distance_km !== null) {
                return a.distance_km - b.distance_km;
            }
            return 0;
        });

        return res.json({
            status: 'success',
            hospital_id: hospitalId,
            hospital_name: hospital.name,
            total_drivers: driversNearHospital.length,
            active_drivers: driversNearHospital.filter(d => d.is_active).length,
            inactive_drivers: driversNearHospital.filter(d => !d.is_active).length,
            data: driversNearHospital
        });

    } catch (error) {
        console.error('Error getting drivers near hospital:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get summary statistics for ambulance drivers
 */
exports.getDriversSummary = async (req, res) => {
    try {
        const { admin_id } = req.query;

        if (!admin_id) {
            return res.status(400).json({
                status: 'fail',
                message: 'admin_id is required'
            });
        }

        const totalDrivers = await AmbulanceDriver.countDocuments({});
        const activeDrivers = await AmbulanceDriver.countDocuments({ is_active: true });
        const inactiveDrivers = totalDrivers - activeDrivers;

        // Count drivers currently on assignment
        const driversOnAssignment = await AmbulanceAssignment.distinct('driver_id', {
            is_completed: false
        });

        return res.json({
            status: 'success',
            data: {
                total: totalDrivers,
                active: activeDrivers,
                inactive: inactiveDrivers,
                on_assignment: driversOnAssignment.length,
                available: activeDrivers - driversOnAssignment.length
            }
        });

    } catch (error) {
        console.error('Error getting drivers summary:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Update driver status (active/inactive)
 */
exports.updateDriverStatus = async (req, res) => {
    try {
        const { driver_id, is_active } = req.body;

        if (driver_id === undefined) {
            return res.status(400).json({
                status: 'fail',
                message: 'driver_id is required'
            });
        }

        if (is_active === undefined) {
            return res.status(400).json({
                status: 'fail',
                message: 'is_active is required'
            });
        }

        const driver = await AmbulanceDriver.findOne({ driver_id: parseInt(driver_id) });

        if (!driver) {
            return res.status(404).json({
                status: 'fail',
                message: 'Driver not found'
            });
        }

        driver.is_active = Boolean(is_active);
        await driver.save();

        // If driver is being set to inactive, remove their live location
        if (!is_active) {
            await AmbulanceLiveLocation.deleteOne({ driver_id: parseInt(driver_id) });
        }

        return res.json({
            status: 'success',
            message: `Driver status updated to ${is_active ? 'active' : 'inactive'}`,
            data: {
                driver_id: driver.driver_id,
                is_active: driver.is_active
            }
        });

    } catch (error) {
        console.error('Error updating driver status:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};
