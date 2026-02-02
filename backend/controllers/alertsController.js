const Equipment = require('../models/Equipment');
const Stock = require('../models/Stock');
const HospitalAdmin = require('../models/HospitalAdmin');
const SosRequest = require('../models/SosRequest');
const AmbulanceAssignment = require('../models/AmbulanceAssignment');

// Get all alerts for admin's hospital
exports.getAllAlerts = async (req, res) => {
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

        const alerts = [];
        const now = new Date();

        // 1. Equipment Alerts - equipment that is under maintenance or down
        const equipmentAlerts = await Equipment.find({
            ...hospitalFilter,
            status: { $in: ['maintenance', 'down'] }
        }).sort({ last_updated: -1 });

        equipmentAlerts.forEach(equipment => {
            alerts.push({
                id: `eq-${equipment.equipment_id}`,
                type: equipment.status === 'down' ? 'critical' : 'warning',
                category: 'Equipment',
                title: equipment.equipment_name,
                message: equipment.status === 'down' 
                    ? `Equipment is not operational and requires immediate attention` 
                    : `Equipment is currently under maintenance`,
                status: equipment.status,
                timestamp: equipment.last_updated || now,
                isRead: false
            });
        });

        // 2. Stock Alerts - low stock items
        const lowStockAlerts = await Stock.find({
            ...hospitalFilter,
            quantity: { $lte: 20 }
        }).sort({ quantity: 1 });

        lowStockAlerts.forEach(stock => {
            const isCritical = stock.quantity <= 5;
            const isLow = stock.quantity <= 10;
            alerts.push({
                id: `st-${stock.stock_id}`,
                type: isCritical ? 'critical' : (isLow ? 'warning' : 'info'),
                category: 'Stock',
                title: stock.item_name,
                message: isCritical 
                    ? `Critical: Only ${stock.quantity} units remaining - Restock immediately!`
                    : `Low stock: ${stock.quantity} units remaining`,
                quantity: stock.quantity,
                timestamp: stock.last_updated || now,
                isRead: false
            });
        });

        // 3. SOS Alerts - pending emergency requests (last 24 hours)
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        try {
            const pendingSos = await SosRequest.find({
                status: { $in: ['pending', 'dispatched'] },
                created_at: { $gte: twentyFourHoursAgo }
            }).sort({ created_at: -1 }).limit(10);

            pendingSos.forEach(sos => {
                alerts.push({
                    id: `sos-${sos.sos_id}`,
                    type: 'critical',
                    category: 'Emergency',
                    title: `SOS Request #${sos.sos_id}`,
                    message: sos.status === 'pending' 
                        ? `Emergency request pending - awaiting dispatch`
                        : `Ambulance dispatched - en route to patient`,
                    status: sos.status,
                    timestamp: sos.created_at || now,
                    isRead: false
                });
            });
        } catch (e) {
            // SOS model might not exist or have different structure
            console.log('SOS alerts skipped:', e.message);
        }

        // 4. Active Ambulance Assignments (info alerts)
        try {
            const activeAssignments = await AmbulanceAssignment.find({
                status: { $in: ['assigned', 'en_route', 'picked_up'] }
            }).sort({ assigned_at: -1 }).limit(5);

            activeAssignments.forEach(assignment => {
                alerts.push({
                    id: `amb-${assignment.assignment_id}`,
                    type: 'info',
                    category: 'Ambulance',
                    title: `Ambulance Assignment #${assignment.assignment_id}`,
                    message: `Status: ${assignment.status.replace('_', ' ')} - Active emergency response`,
                    status: assignment.status,
                    timestamp: assignment.assigned_at || now,
                    isRead: false
                });
            });
        } catch (e) {
            console.log('Ambulance alerts skipped:', e.message);
        }

        // Sort alerts: critical first, then warning, then info, then by timestamp
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        alerts.sort((a, b) => {
            const severityDiff = severityOrder[a.type] - severityOrder[b.type];
            if (severityDiff !== 0) return severityDiff;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        // Calculate summary
        const summary = {
            total: alerts.length,
            critical: alerts.filter(a => a.type === 'critical').length,
            warning: alerts.filter(a => a.type === 'warning').length,
            info: alerts.filter(a => a.type === 'info').length
        };

        return res.json({
            status: 'success',
            data: alerts,
            summary: summary,
            timestamp: now
        });

    } catch (error) {
        console.error('Error getting alerts:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

// Get alerts summary count (for badge in sidebar)
exports.getAlertsSummary = async (req, res) => {
    try {
        const { admin_id } = req.query;

        if (!admin_id) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'admin_id is required' 
            });
        }

        const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });

        let hospitalFilter = {};
        if (adminRecord && adminRecord.hospital_id) {
            hospitalFilter = { hospital_id: adminRecord.hospital_id };
        }

        // Count equipment issues
        const equipmentCount = await Equipment.countDocuments({
            ...hospitalFilter,
            status: { $in: ['maintenance', 'down'] }
        });

        // Count low stock items
        const stockCount = await Stock.countDocuments({
            ...hospitalFilter,
            quantity: { $lte: 20 }
        });

        // Count critical items
        const criticalEquipment = await Equipment.countDocuments({
            ...hospitalFilter,
            status: 'down'
        });

        const criticalStock = await Stock.countDocuments({
            ...hospitalFilter,
            quantity: { $lte: 5 }
        });

        return res.json({
            status: 'success',
            data: {
                total: equipmentCount + stockCount,
                critical: criticalEquipment + criticalStock,
                equipment: equipmentCount,
                stock: stockCount
            }
        });

    } catch (error) {
        console.error('Error getting alerts summary:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

// Mark alert as read (for future implementation)
exports.markAlertRead = async (req, res) => {
    try {
        const { alert_id, admin_id } = req.body;

        // This would require an AlertRead model to track read status
        // For now, just return success
        return res.json({
            status: 'success',
            message: 'Alert marked as read',
            alert_id: alert_id
        });

    } catch (error) {
        console.error('Error marking alert read:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Internal server error',
            error: error.message 
        });
    }
};
