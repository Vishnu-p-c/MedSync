const Doctor = require('../models/Doctor');
const HospitalAdmin = require('../models/HospitalAdmin');

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

        // Get detailed doctor information for debugging
        let doctorsList;
        if (facilityType === 'hospital') {
            doctorsList = await Doctor.find({ 
                hospital_id: { $in: [facilityId] }
            }).select('doctor_id name department is_available hospital_id');
        } else {
            doctorsList = await Doctor.find({ 
                clinic_id: { $in: [facilityId] }
            }).select('doctor_id name department is_available clinic_id');
        }

        return res.json({
            status: 'success',
            facilityId: facilityId,
            facilityType: facilityType,
            totalDoctors: doctorsCount,
            doctorsOnDuty: availableDoctorsCount,
            doctors: doctorsList  // Include detailed list for verification
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