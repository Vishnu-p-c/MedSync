const Doctor = require('../models/Doctor');
const HospitalAdmin = require('../models/HospitalAdmin');
const Equipment = require('../models/Equipment');
const Stock = require('../models/Stock');

// Controller to get the number of doctors in the admin's hospital
exports.getDoctorsCount = async (req, res) => {
    try {
        // Get admin_id from request (sent from frontend)
        const { admin_id } = req.query; // or req.body or req.params depending on your route

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

        // Get the hospital_id or clinic_id
        const facilityId = adminRecord.hospital_id || adminRecord.clinic_id;
        const facilityType = adminRecord.admin_type; // 'hospital' or 'clinic'

        if (!facilityId) {
            return res.status(404).json({ 
                status: 'fail', 
                message: 'Admin not assigned to any facility' 
            });
        }

        // Count doctors in this hospital/clinic
        // Note: hospital_id and clinic_id are arrays in Doctor model, so use $in to check if facilityId is in the array
        let doctorsCount;
        if (facilityType === 'hospital') {
            doctorsCount = await Doctor.countDocuments({ 
                hospital_id: { $in: [facilityId] }
            });
        } else {
            doctorsCount = await Doctor.countDocuments({ 
                clinic_id: { $in: [facilityId] }
            });
        }

        // Optional: Count only available doctors
        let availableDoctorsCount;
        if (facilityType === 'hospital') {
            availableDoctorsCount = await Doctor.countDocuments({ 
                hospital_id: { $in: [facilityId] },
                is_available: true 
            });
        } else {
            availableDoctorsCount = await Doctor.countDocuments({ 
                clinic_id: { $in: [facilityId] },
                is_available: true 
            });
        }

        return res.json({
            status: 'success',
            facilityId: facilityId,
            facilityType: facilityType,
            totalDoctors: doctorsCount,
            doctorsOnDuty: availableDoctorsCount
        });

    } catch (error) {
        console.error('Error getting doctors count:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Internal server error',
            error: error.message 
        });
    }
}

// Controller to get critical alerts (equipment under maintenance/down and low stock)
exports.getCriticalAlerts = async (req, res) => {
    try {
        const { admin_id } = req.query;

        if (!admin_id) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'admin_id is required' 
            });
        }

        // Find which hospital this admin manages
        const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });

        let hospitalFilter = {};
        if (adminRecord && adminRecord.hospital_id) {
            hospitalFilter = { hospital_id: adminRecord.hospital_id };
        }

        // Fetch equipment that is under maintenance or down
        const equipmentAlerts = await Equipment.find({
            ...hospitalFilter,
            status: { $in: ['maintenance', 'down'] }
        }).sort({ last_updated: -1 }).limit(10);

        // Fetch low stock items (quantity <= 10)
        const lowStockAlerts = await Stock.find({
            ...hospitalFilter,
            quantity: { $lte: 10 }
        }).sort({ quantity: 1 }).limit(10);

        // Format alerts for frontend
        const alerts = [];

        // Add equipment alerts
        equipmentAlerts.forEach(equipment => {
            alerts.push({
                id: `eq-${equipment.equipment_id}`,
                type: equipment.status === 'down' ? 'Equipment Fault' : 'Under Maintenance',
                item: equipment.equipment_name,
                message: equipment.status === 'down' 
                    ? 'Equipment is not operational' 
                    : 'Equipment is under maintenance',
                severity: equipment.status === 'down' ? 'critical' : 'warning',
                category: 'equipment',
                lastUpdated: equipment.last_updated
            });
        });

        // Add low stock alerts
        lowStockAlerts.forEach(stock => {
            const isCritical = stock.quantity <= 5;
            alerts.push({
                id: `st-${stock.stock_id}`,
                type: 'Low Stock',
                item: `${stock.item_name} (${isCritical ? 'Critical' : 'Low'})`,
                message: `Only ${stock.quantity} units remaining`,
                severity: isCritical ? 'critical' : 'warning',
                category: 'stock',
                quantity: stock.quantity,
                lastUpdated: stock.last_updated
            });
        });

        // Sort by severity (critical first) and then by lastUpdated
        alerts.sort((a, b) => {
            if (a.severity === 'critical' && b.severity !== 'critical') return -1;
            if (a.severity !== 'critical' && b.severity === 'critical') return 1;
            return new Date(b.lastUpdated) - new Date(a.lastUpdated);
        });

        return res.json({
            status: 'success',
            data: alerts,
            count: alerts.length,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Error getting critical alerts:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Internal server error',
            error: error.message 
        });
    }
}