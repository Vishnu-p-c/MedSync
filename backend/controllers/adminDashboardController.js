const Doctor = require('../models/Doctor');
const HospitalAdmin = require('../models/HospitalAdmin');
const Equipment = require('../models/Equipment');
const Stock = require('../models/Stock');
const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');
const Clinic = require('../models/Clinic');
const User = require('../models/user');
const DoctorAttendanceLog = require('../models/DoctorAttendanceLog');

// Controller to get the number of doctors in the admin's hospital
exports.getDoctorsCount = async (req, res) => {
    try {
        // Get admin_id from request (sent from frontend)
        const admin_id = req.query.admin_id || req.body.admin_id || req.params.admin_id;

        if (!admin_id || isNaN(parseInt(admin_id))) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'admin_id is required and must be a number' 
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
};

/**
 * Get patient inflow data for the last 24 hours
 * Returns hourly counts of appointments/patient visits
 */
exports.getPatientInflow = async (req, res) => {
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

        // Build match stage for aggregation
        const matchStage = {};
        
        if (adminRecord && adminRecord.hospital_id) {
            matchStage.hospital_id = adminRecord.hospital_id;
        }

        // Get appointments from the last 24 hours
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        matchStage.created_at = { $gte: twentyFourHoursAgo };

        // Aggregate appointments by hour
        const hourlyData = await Appointment.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $hour: '$created_at' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Create a full 24-hour array with zeros for missing hours
        const currentHour = new Date().getHours();
        const inflowData = [];
        
        // Build array from 24 hours ago to current hour
        for (let i = 0; i < 24; i++) {
            const hour = (currentHour - 23 + i + 24) % 24;
            const found = hourlyData.find(item => item._id === hour);
            inflowData.push({
                hour: hour,
                label: `${hour.toString().padStart(2, '0')}:00`,
                count: found ? found.count : 0
            });
        }

        // Calculate summary statistics
        const totalInflow = inflowData.reduce((sum, item) => sum + item.count, 0);
        const maxInflow = Math.max(...inflowData.map(item => item.count));
        const avgInflow = totalInflow / 24;

        return res.json({
            status: 'success',
            data: inflowData,
            summary: {
                total: totalInflow,
                max: maxInflow,
                average: Math.round(avgInflow * 10) / 10
            },
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Error getting patient inflow:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

/**
 * Get hospital/clinic info and admin details
 * Returns name and basic details of the facility along with admin info
 */
exports.getHospitalInfo = async (req, res) => {
    try {
        const { admin_id } = req.query;

        if (!admin_id) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'admin_id is required' 
            });
        }

        // Find which hospital/clinic this admin manages
        const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });

        if (!adminRecord) {
            return res.status(404).json({ 
                status: 'fail', 
                message: 'Admin not found or not assigned to any facility' 
            });
        }

        // Get admin user details
        const adminUser = await User.findOne({ user_id: parseInt(admin_id) });
        
        let adminInfo = {
            firstName: 'Admin',
            lastName: '',
            fullName: 'Admin',
            email: '',
            role: 'admin'
        };

        if (adminUser) {
            adminInfo = {
                firstName: adminUser.first_name,
                lastName: adminUser.last_name || '',
                fullName: `${adminUser.first_name}${adminUser.last_name ? ' ' + adminUser.last_name : ''}`,
                email: adminUser.email,
                role: adminUser.role
            };
        }

        let facilityInfo = null;

        if (adminRecord.admin_type === 'hospital' && adminRecord.hospital_id) {
            const hospital = await Hospital.findOne({ hospital_id: adminRecord.hospital_id });
            if (hospital) {
                facilityInfo = {
                    id: hospital.hospital_id,
                    name: hospital.name,
                    type: 'hospital',
                    address: hospital.address,
                    rushLevel: hospital.rush_level
                };
            }
        } else if (adminRecord.admin_type === 'clinic' && adminRecord.clinic_id) {
            const clinic = await Clinic.findOne({ clinic_id: adminRecord.clinic_id });
            if (clinic) {
                facilityInfo = {
                    id: clinic.clinic_id,
                    name: clinic.name,
                    type: 'clinic',
                    address: clinic.address
                };
            }
        }

        if (!facilityInfo) {
            return res.status(404).json({ 
                status: 'fail', 
                message: 'Facility not found' 
            });
        }

        return res.json({
            status: 'success',
            data: {
                ...facilityInfo,
                admin: adminInfo
            },
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Error getting hospital info:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

// Controller to get all doctors for an admin's hospital/clinic with search and filter
exports.getDoctorsList = async (req, res) => {
    try {
        const { admin_id, search, filterBy, filterValue } = req.query;

        if (!admin_id) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'admin_id is required' 
            });
        }

        // Find which hospital/clinic this admin manages
        const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });

        if (!adminRecord) {
            return res.status(404).json({ 
                status: 'fail', 
                message: 'Admin not found or not assigned to any facility' 
            });
        }

        const facilityId = adminRecord.hospital_id || adminRecord.clinic_id;
        const facilityType = adminRecord.admin_type;

        if (!facilityId) {
            return res.status(404).json({ 
                status: 'fail', 
                message: 'Admin not assigned to any facility' 
            });
        }

        // Build query based on facility type
        let query = {};
        if (facilityType === 'hospital') {
            query.hospital_id = { $in: [facilityId] };
        } else {
            query.clinic_id = { $in: [facilityId] };
        }

        // Add search filter if provided
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { first_name: searchRegex },
                { last_name: searchRegex },
                { name: searchRegex },
                { department: searchRegex },
                { mrn: searchRegex }
            ];
        }

        // Add specific filter if provided
        if (filterBy && filterValue) {
            if (filterBy === 'department') {
                query.department = new RegExp(filterValue, 'i');
            } else if (filterBy === 'status') {
                query.is_available = filterValue.toLowerCase() === 'on-duty';
            }
        }

        // Fetch doctors
        const doctors = await Doctor.find(query).lean();

        // Format the response with last attendance info
        const formattedDoctors = doctors.map(doctor => {
            // Format last check-in time
            let lastCheckIn = 'Never';
            if (doctor.last_attendance_time) {
                const attendanceDate = new Date(doctor.last_attendance_time);
                const now = new Date();
                const diffMs = now - attendanceDate;
                const diffHours = diffMs / (1000 * 60 * 60);
                const diffDays = diffMs / (1000 * 60 * 60 * 24);

                if (diffHours < 24) {
                    // Today - show time
                    lastCheckIn = attendanceDate.toLocaleTimeString('en-IN', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'Asia/Kolkata'
                    }) + ' IST';
                } else if (diffDays < 2) {
                    // Yesterday
                    lastCheckIn = 'Yesterday, ' + attendanceDate.toLocaleTimeString('en-IN', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'Asia/Kolkata'
                    }) + ' IST';
                } else {
                    // Older - show date
                    lastCheckIn = attendanceDate.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                }
            }

            return {
                id: doctor.doctor_id,
                name: doctor.name || `Dr. ${doctor.first_name}${doctor.last_name ? ' ' + doctor.last_name : ''}`,
                firstName: doctor.first_name,
                lastName: doctor.last_name || '',
                department: doctor.department,
                status: doctor.is_available ? 'On-Duty' : 'Off-Duty',
                isAvailable: doctor.is_available,
                lastCheckIn: lastCheckIn,
                mrn: doctor.mrn,
                qualifications: doctor.qualifications || [],
                hospitals: doctor.hospitals || [],
                clinics: doctor.clinics || []
            };
        });

        return res.json({
            status: 'success',
            data: formattedDoctors,
            count: formattedDoctors.length,
            facilityId: facilityId,
            facilityType: facilityType
        });

    } catch (error) {
        console.error('Error getting doctors list:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

// Controller to get unique departments for filtering
exports.getDepartments = async (req, res) => {
    try {
        const { admin_id } = req.query;

        if (!admin_id) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'admin_id is required' 
            });
        }

        // Find which hospital/clinic this admin manages
        const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });

        if (!adminRecord) {
            return res.status(404).json({ 
                status: 'fail', 
                message: 'Admin not found or not assigned to any facility' 
            });
        }

        const facilityId = adminRecord.hospital_id || adminRecord.clinic_id;
        const facilityType = adminRecord.admin_type;

        // Build query based on facility type
        let query = {};
        if (facilityType === 'hospital') {
            query.hospital_id = { $in: [facilityId] };
        } else {
            query.clinic_id = { $in: [facilityId] };
        }

        // Get unique departments
        const departments = await Doctor.distinct('department', query);

        return res.json({
            status: 'success',
            data: departments.filter(d => d) // Remove null/empty values
        });

    } catch (error) {
        console.error('Error getting departments:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

// Controller to add a new doctor to the admin's hospital/clinic
const bcrypt = require('bcrypt');

exports.addDoctor = async (req, res) => {
    try {
        const {
            admin_id,
            first_name,
            last_name,
            username,
            email,
            password,
            phone,
            date_of_birth,
            gender,
            mrn,
            department,
            qualifications
        } = req.body;

        // Validate required fields
        const missing = [];
        if (!admin_id) missing.push('admin_id');
        if (!first_name) missing.push('first_name');
        if (!username) missing.push('username');
        if (!email) missing.push('email');
        if (!password) missing.push('password');
        if (!phone) missing.push('phone');
        if (!date_of_birth) missing.push('date_of_birth');
        if (!gender) missing.push('gender');
        if (!mrn) missing.push('mrn');
        if (!department) missing.push('department');

        if (missing.length) {
            return res.status(400).json({
                status: 'fail',
                message: 'missing_fields',
                missing
            });
        }

        // Find which hospital/clinic this admin manages
        const adminRecord = await HospitalAdmin.findOne({ admin_id: parseInt(admin_id) });

        if (!adminRecord) {
            return res.status(404).json({
                status: 'fail',
                message: 'Admin not found or not assigned to any facility'
            });
        }

        const facilityId = adminRecord.hospital_id || adminRecord.clinic_id;
        const facilityType = adminRecord.admin_type;

        // Check if username, email, or phone already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }, { phone }]
        }).lean();

        if (existingUser) {
            let conflictField = 'user';
            if (existingUser.username === username) conflictField = 'username';
            else if (existingUser.email === email) conflictField = 'email';
            else if (existingUser.phone === phone) conflictField = 'phone';
            
            return res.status(409).json({
                status: 'fail',
                message: `${conflictField}_already_exists`
            });
        }

        // Check if MRN already exists
        const existingDoctor = await Doctor.findOne({ mrn }).lean();
        if (existingDoctor) {
            return res.status(409).json({
                status: 'fail',
                message: 'mrn_already_exists'
            });
        }

        // Generate new user_id
        const lastUser = await User.findOne().sort({ user_id: -1 }).lean();
        const newUserId = (lastUser?.user_id || 0) + 1;

        // Hash the password
        const password_hash = await bcrypt.hash(password, 10);

        // Parse date of birth
        const parsedDob = new Date(date_of_birth);
        if (isNaN(parsedDob.getTime())) {
            return res.status(400).json({
                status: 'fail',
                message: 'invalid_date_of_birth'
            });
        }

        // Create the User record
        const newUser = new User({
            user_id: newUserId,
            first_name,
            last_name: last_name || '',
            username,
            password_hash,
            role: 'doctor',
            email,
            phone,
            date_of_birth: parsedDob,
            gender
        });

        try {
            await newUser.save();
        } catch (userSaveError) {
            console.error('Error saving user:', userSaveError);
            if (userSaveError.code === 11000) {
                // Duplicate key error
                const field = Object.keys(userSaveError.keyPattern)[0];
                return res.status(409).json({
                    status: 'fail',
                    message: `${field}_already_exists`
                });
            }
            throw userSaveError;
        }

        // Create the Doctor record
        const qualificationsArray = Array.isArray(qualifications) 
            ? qualifications 
            : (qualifications ? [qualifications] : []);

        const doctorData = {
            doctor_id: newUserId,
            first_name,
            last_name: last_name || '',
            name: `Dr. ${first_name} ${last_name || ''}`.trim(),
            mrn,
            department,
            qualifications: qualificationsArray,
            multi_place: false,
            is_available: false
        };

        // Assign to the admin's facility
        if (facilityType === 'hospital') {
            doctorData.hospital_id = [facilityId];
        } else {
            doctorData.clinic_id = [facilityId];
        }

        const newDoctor = new Doctor(doctorData);
        
        try {
            await newDoctor.save();
        } catch (doctorSaveError) {
            console.error('Error saving doctor:', doctorSaveError);
            // Rollback: delete the user we just created
            await User.deleteOne({ user_id: newUserId });
            
            if (doctorSaveError.code === 11000) {
                const field = Object.keys(doctorSaveError.keyPattern)[0];
                return res.status(409).json({
                    status: 'fail',
                    message: `${field}_already_exists`
                });
            }
            throw doctorSaveError;
        }

        return res.status(201).json({
            status: 'success',
            message: 'Doctor added successfully',
            data: {
                user_id: newUserId,
                doctor_id: newUserId,
                name: doctorData.name,
                username,
                email,
                department,
                mrn
            }
        });

    } catch (error) {
        console.error('Error adding doctor:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message,
            stack: error.stack
        });
    }
};