const Hospital = require('../models/Hospital');
const Clinic = require('../models/Clinic');
const HospitalAdmin = require('../models/HospitalAdmin');
const HospitalRushLog = require('../models/Rush');

// Get current rush level for admin's facility
exports.getRushLevel = async (req, res) => {
    try {
        const { admin_id } = req.query;

        if (!admin_id) {
            return res.status(400).json({
                status: 'fail',
                message: 'admin_id is required'
            });
        }

        // Find admin's facility
        const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });

        if (!adminRecord) {
            return res.status(404).json({
                status: 'fail',
                message: 'Admin not found'
            });
        }

        const facilityType = adminRecord.admin_type;
        let rushLevel = 'low';
        let facilityName = '';

        if (facilityType === 'hospital' && adminRecord.hospital_id) {
            const hospital = await Hospital.findOne({ hospital_id: adminRecord.hospital_id });
            if (hospital) {
                rushLevel = hospital.rush_level || 'low';
                facilityName = hospital.name;
            }
        } else if (facilityType === 'clinic' && adminRecord.clinic_id) {
            const clinic = await Clinic.findOne({ clinic_id: adminRecord.clinic_id });
            if (clinic) {
                rushLevel = clinic.rush_level || 'low';
                facilityName = clinic.name;
            }
        }

        return res.json({
            status: 'success',
            rushLevel: rushLevel.toUpperCase(),
            facilityName,
            facilityType,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Error getting rush level:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update rush level for admin's facility
exports.updateRushLevel = async (req, res) => {
    try {
        const { admin_id, rush_level } = req.body;

        if (!admin_id || !rush_level) {
            return res.status(400).json({
                status: 'fail',
                message: 'admin_id and rush_level are required'
            });
        }

        const validLevels = ['low', 'medium', 'high', 'critical'];
        if (!validLevels.includes(rush_level.toLowerCase())) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid rush level. Must be: low, medium, high, or critical'
            });
        }

        // Find admin's facility
        const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });

        if (!adminRecord) {
            return res.status(404).json({
                status: 'fail',
                message: 'Admin not found'
            });
        }

        const facilityType = adminRecord.admin_type;
        let updatedFacility;

        if (facilityType === 'hospital' && adminRecord.hospital_id) {
            updatedFacility = await Hospital.findOneAndUpdate(
                { hospital_id: adminRecord.hospital_id },
                { rush_level: rush_level.toLowerCase(), updated_at: new Date() },
                { new: true }
            );

            // Log the rush level change
            const logCount = await HospitalRushLog.countDocuments();
            await HospitalRushLog.create({
                log_id: logCount + 1,
                hospital_id: adminRecord.hospital_id,
                rush_level: rush_level.toLowerCase(),
                timestamp: new Date()
            });
        } else if (facilityType === 'clinic' && adminRecord.clinic_id) {
            updatedFacility = await Clinic.findOneAndUpdate(
                { clinic_id: adminRecord.clinic_id },
                { rush_level: rush_level.toLowerCase(), updated_at: new Date() },
                { new: true }
            );
        }

        if (!updatedFacility) {
            return res.status(404).json({
                status: 'fail',
                message: 'Facility not found'
            });
        }

        return res.json({
            status: 'success',
            message: 'Rush level updated successfully',
            rushLevel: rush_level.toUpperCase(),
            facilityName: updatedFacility.name,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Error updating rush level:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Calculate rush level automatically based on metrics
exports.calculateRushLevel = async (req, res) => {
    try {
        const { admin_id } = req.query;

        if (!admin_id) {
            return res.status(400).json({
                status: 'fail',
                message: 'admin_id is required'
            });
        }

        // Find admin's facility
        const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });

        if (!adminRecord) {
            return res.status(404).json({
                status: 'fail',
                message: 'Admin not found'
            });
        }

        // Calculate metrics for rush level determination
        const Doctor = require('../models/Doctor');
        const SosRequest = require('../models/SosRequest');

        const facilityId = adminRecord.hospital_id || adminRecord.clinic_id;
        const facilityType = adminRecord.admin_type;

        // Get doctor availability
        let totalDoctors, availableDoctors;
        if (facilityType === 'hospital') {
            totalDoctors = await Doctor.countDocuments({ hospital_id: { $in: [facilityId] } });
            availableDoctors = await Doctor.countDocuments({ 
                hospital_id: { $in: [facilityId] }, 
                is_available: true 
            });
        } else {
            totalDoctors = await Doctor.countDocuments({ clinic_id: { $in: [facilityId] } });
            availableDoctors = await Doctor.countDocuments({ 
                clinic_id: { $in: [facilityId] }, 
                is_available: true 
            });
        }

        // Get pending SOS requests (last 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const pendingSos = await SosRequest.countDocuments({
            hospital_id: facilityId,
            status: 'pending',
            timestamp: { $gte: oneHourAgo }
        });

        // Calculate rush level based on metrics
        let calculatedLevel = 'low';
        const doctorRatio = totalDoctors > 0 ? availableDoctors / totalDoctors : 1;

        if (pendingSos >= 10 || doctorRatio < 0.2) {
            calculatedLevel = 'critical';
        } else if (pendingSos >= 5 || doctorRatio < 0.4) {
            calculatedLevel = 'high';
        } else if (pendingSos >= 2 || doctorRatio < 0.6) {
            calculatedLevel = 'medium';
        }

        return res.json({
            status: 'success',
            calculatedRushLevel: calculatedLevel.toUpperCase(),
            metrics: {
                totalDoctors,
                availableDoctors,
                doctorAvailabilityRatio: doctorRatio,
                pendingSosRequests: pendingSos
            },
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Error calculating rush level:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};
