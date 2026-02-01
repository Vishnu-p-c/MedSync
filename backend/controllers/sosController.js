const SosRequest = require('../models/SosRequest');
const HospitalAdmin = require('../models/HospitalAdmin');

/**
 * Get SOS requests summary for admin dashboard
 * Returns counts: total, pending, inProgress, assigned, completed, cancelled
 */
exports.getSosSummary = async (req, res) => {
    try {
        const { admin_id } = req.query;

        if (!admin_id) {
            return res.status(400).json({
                status: 'fail',
                message: 'admin_id is required'
            });
        }

        // Find admin's hospital
        const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });

        let hospitalFilter = {};
        
        // If admin is assigned to a hospital, filter SOS by that hospital
        if (adminRecord && adminRecord.hospital_id) {
            hospitalFilter = { assigned_hospital_id: adminRecord.hospital_id };
        }
        // If no hospital assigned, show all SOS requests (super admin view)

        // Count by status
        const [pending, inProgress, assigned, completed, cancelled, total] = await Promise.all([
            SosRequest.countDocuments({ 
                ...hospitalFilter,
                status: 'pending' 
            }),
            SosRequest.countDocuments({ 
                ...hospitalFilter,
                status: { $in: ['awaiting_driver', 'awaiting_driver_response', 'driver_arrived'] }
            }),
            SosRequest.countDocuments({ 
                ...hospitalFilter,
                status: 'assigned' 
            }),
            SosRequest.countDocuments({ 
                ...hospitalFilter,
                status: 'completed' 
            }),
            SosRequest.countDocuments({ 
                ...hospitalFilter,
                status: 'cancelled' 
            }),
            SosRequest.countDocuments(hospitalFilter)
        ]);

        return res.json({
            status: 'success',
            data: {
                total,
                pending,
                inProgress,
                assigned,
                completed,
                cancelled
            },
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Error getting SOS summary:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get recent SOS requests list for admin dashboard
 * Returns latest SOS requests with details
 */
exports.getRecentSosRequests = async (req, res) => {
    try {
        const { admin_id, limit = 10 } = req.query;

        if (!admin_id) {
            return res.status(400).json({
                status: 'fail',
                message: 'admin_id is required'
            });
        }

        // Find admin's hospital
        const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });

        let hospitalFilter = {};
        if (adminRecord && adminRecord.hospital_id) {
            hospitalFilter = { assigned_hospital_id: adminRecord.hospital_id };
        }

        // Get recent SOS requests
        const recentRequests = await SosRequest.find(hospitalFilter)
            .sort({ created_at: -1 })
            .limit(parseInt(limit))
            .select('sos_id patient_id severity status created_at eta_minutes assigned_driver_id');

        return res.json({
            status: 'success',
            data: recentRequests,
            count: recentRequests.length,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Error getting recent SOS requests:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get SOS requests by severity breakdown
 */
exports.getSosBySeverity = async (req, res) => {
    try {
        const { admin_id } = req.query;

        if (!admin_id) {
            return res.status(400).json({
                status: 'fail',
                message: 'admin_id is required'
            });
        }

        // Find admin's hospital
        const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });

        let matchStage = {};
        if (adminRecord && adminRecord.hospital_id) {
            matchStage = { assigned_hospital_id: adminRecord.hospital_id };
        }

        // Aggregate by severity
        const severityBreakdown = await SosRequest.aggregate([
            { $match: matchStage },
            { 
                $group: { 
                    _id: '$severity', 
                    count: { $sum: 1 } 
                } 
            },
            { $sort: { count: -1 } }
        ]);

        // Transform to object format
        const severityData = {
            critical: 0,
            severe: 0,
            moderate: 0,
            mild: 0,
            unknown: 0
        };

        severityBreakdown.forEach(item => {
            if (item._id && severityData.hasOwnProperty(item._id)) {
                severityData[item._id] = item.count;
            }
        });

        return res.json({
            status: 'success',
            data: severityData,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Error getting SOS by severity:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
};
