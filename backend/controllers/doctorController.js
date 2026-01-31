const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Clinic = require('../models/Clinic');

// Haversine formula to calculate distance between two lat/long points (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;  // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper to get next appointment_id
const getNextAppointmentId = async () => {
  const lastAppointment =
      await Appointment.findOne().sort({appointment_id: -1});
  return lastAppointment ? lastAppointment.appointment_id + 1 : 1;
};

// POST /doctor/appointment - Create a new appointment
const createAppointment = async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      hospital_id,
      consultation_place,
      clinic_name,
      appointment_time
    } = req.body;

    // Validate required fields
    const missing = [];
    if (!patient_id) missing.push('patient_id');
    if (!doctor_id) missing.push('doctor_id');
    if (!appointment_time) missing.push('appointment_time');

    if (missing.length > 0) {
      return res.json({status: 'fail', message: 'missing_fields', missing});
    }

    // Validate appointment_time is not in the past
    const appointmentDate = new Date(appointment_time);
    if (isNaN(appointmentDate.getTime())) {
      return res.json({status: 'fail', message: 'invalid_appointment_time'});
    }

    if (appointmentDate <= new Date()) {
      return res.json(
          {status: 'fail', message: 'appointment_time_cannot_be_in_past'});
    }

    // Validate patient exists
    const patient = await User.findOne({user_id: patient_id});
    if (!patient) {
      return res.json({status: 'fail', message: 'patient_not_found'});
    }

    // Validate doctor exists
    const doctor = await Doctor.findOne({doctor_id: doctor_id});
    if (!doctor) {
      return res.json({status: 'fail', message: 'doctor_not_found'});
    }

    // Validate consultation_place if provided
    if (consultation_place &&
        !['hospital', 'clinic'].includes(consultation_place)) {
      return res.json({status: 'fail', message: 'invalid_consultation_place'});
    }

    // If consultation is at clinic, clinic_name should be provided
    if (consultation_place === 'clinic' && !clinic_name) {
      return res.json({
        status: 'fail',
        message: 'clinic_name_required_for_clinic_consultation'
      });
    }

    // Generate new appointment_id
    const appointment_id = await getNextAppointmentId();

    // Create appointment
    const appointment = new Appointment({
      appointment_id,
      patient_id,
      doctor_id,
      hospital_id: hospital_id || null,
      consultation_place: consultation_place || 'hospital',
      clinic_name: clinic_name || null,
      appointment_time: appointmentDate,
      status: 'upcoming'
    });

    await appointment.save();

    return res.json({
      status: 'success',
      appointment_id: appointment.appointment_id,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      hospital_id: appointment.hospital_id,
      consultation_place: appointment.consultation_place,
      clinic_name: appointment.clinic_name,
      appointment_time: appointment.appointment_time,
      status: appointment.status,
      created_at: appointment.created_at
    });

  } catch (error) {
    console.error('Create appointment error:', error);
    return res.json({status: 'error', message: 'server_error'});
  }
};

// POST /doctor/appointment/patient - Get all upcoming appointments for a
// patient
const getPatientAppointments = async (req, res) => {
  try {
    const {user_id} = req.body;

    if (!user_id) {
      return res.json(
          {status: 'fail', message: 'missing_fields', missing: ['user_id']});
    }

    // Validate user exists
    const user = await User.findOne({user_id: user_id});
    if (!user) {
      return res.json({status: 'fail', message: 'user_not_found'});
    }

    // Get all upcoming appointments for this patient
    const appointments = await Appointment
                             .find({
                               patient_id: user_id,
                               status: 'upcoming',
                               appointment_time: {$gt: new Date()}
                             })
                             .sort({appointment_time: 1});

    // Fetch doctor details for each appointment
    const appointmentsWithDetails =
        await Promise.all(appointments.map(async (apt) => {
          const doctor = await Doctor.findOne({doctor_id: apt.doctor_id});
          return {
            appointment_id: apt.appointment_id,
            doctor_id: apt.doctor_id,
            doctor_name: doctor ?
                `${doctor.first_name} ${doctor.last_name || ''}`.trim() :
                'Unknown',
            department: doctor ? doctor.department : 'Unknown',
            hospital_id: apt.hospital_id,
            consultation_place: apt.consultation_place,
            clinic_name: apt.clinic_name,
            appointment_time: apt.appointment_time,
            status: apt.status,
            created_at: apt.created_at
          };
        }));

    return res.json({
      status: 'success',
      total_appointments: appointmentsWithDetails.length,
      appointments: appointmentsWithDetails
    });

  } catch (error) {
    console.error('Get patient appointments error:', error);
    return res.json({status: 'error', message: 'server_error'});
  }
};

// POST /doctor/appointment/doctor - Get all appointments for a doctor (by
// user_id)
const getDoctorAppointments = async (req, res) => {
  try {
    const {user_id} = req.body;

    if (!user_id) {
      return res.json(
          {status: 'fail', message: 'missing_fields', missing: ['user_id']});
    }

    // First check if user exists and is a doctor
    const user = await User.findOne({user_id: user_id});
    if (!user) {
      return res.json({status: 'fail', message: 'user_not_found'});
    }

    if (user.role !== 'doctor') {
      return res.json({status: 'fail', message: 'user_is_not_a_doctor'});
    }

    // Get doctor details (doctor_id is same as user_id based on registration
    // flow)
    const doctor = await Doctor.findOne({doctor_id: user_id});
    if (!doctor) {
      return res.json({status: 'fail', message: 'doctor_details_not_found'});
    }

    // Get all appointments for this doctor
    const appointments =
        await Appointment.find({doctor_id: doctor.doctor_id}).sort({
          appointment_time: 1
        });

    // Separate into upcoming and past/completed
    const now = new Date();
    const upcomingAppointments = [];
    const pastAppointments = [];

    for (const apt of appointments) {
      const patient = await User.findOne({user_id: apt.patient_id});
      const appointmentData = {
        appointment_id: apt.appointment_id,
        patient_id: apt.patient_id,
        patient_name: patient ?
            `${patient.first_name} ${patient.last_name || ''}`.trim() :
            'Unknown',
        hospital_id: apt.hospital_id,
        consultation_place: apt.consultation_place,
        clinic_name: apt.clinic_name,
        appointment_time: apt.appointment_time,
        status: apt.status,
        created_at: apt.created_at
      };

      if (apt.status === 'upcoming' && apt.appointment_time > now) {
        upcomingAppointments.push(appointmentData);
      } else {
        pastAppointments.push(appointmentData);
      }
    }

    return res.json({
      status: 'success',
      doctor_id: doctor.doctor_id,
      doctor_name: `${doctor.first_name} ${doctor.last_name || ''}`.trim(),
      department: doctor.department,
      total_appointments: appointments.length,
      upcoming_count: upcomingAppointments.length,
      past_count: pastAppointments.length,
      upcoming_appointments: upcomingAppointments,
      past_appointments: pastAppointments
    });

  } catch (error) {
    console.error('Get doctor appointments error:', error);
    return res.json({status: 'error', message: 'server_error'});
  }
};

// POST /doctor/list - Get paginated list of doctors with optional filters and
// location-based sorting
const listDoctors = async (req, res) => {
  try {
    const {
      department,
      search,
      hospital_id,
      available,
      latitude,
      longitude,
      page = 1,
      limit = 10
    } = req.body;

    // Validate and cap limit
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));

    // Build filter query
    const filter = {};

    if (department) {
      filter.department = {$regex: department, $options: 'i'};
    }

    if (search) {
      filter.$or = [
        {first_name: {$regex: search, $options: 'i'}},
        {last_name: {$regex: search, $options: 'i'}},
        {name: {$regex: search, $options: 'i'}}
      ];
    }

    if (hospital_id) {
      filter.hospital_id = parseInt(hospital_id);
    }

    if (available === true || available === 'true') {
      filter.is_available = true;
    }

    // Get all matching doctors
    let doctors = await Doctor.find(filter).lean();

    // If patient location is provided, calculate distances and sort
    const hasLocation = latitude !== undefined && longitude !== undefined &&
        !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));

    if (hasLocation) {
      const patientLat = parseFloat(latitude);
      const patientLon = parseFloat(longitude);

      // Fetch all hospitals and clinics for distance calculation
      const hospitals = await Hospital.find({}).lean();
      const clinics = await Clinic.find({}).lean();

      const hospitalMap = {};
      hospitals.forEach(h => {
        hospitalMap[h.hospital_id] = h;
      });

      const clinicMap = {};
      clinics.forEach(c => {
        clinicMap[c.clinic_id] = c;
      });

      // Calculate minimum distance for each doctor
      doctors = await Promise.all(doctors.map(async (doctor) => {
        let minDistance = Infinity;
        let nearestLocation = null;

        // Check hospital distances
        if (doctor.hospital_id && Array.isArray(doctor.hospital_id)) {
          for (const hId of doctor.hospital_id) {
            const hospital = hospitalMap[hId];
            if (hospital && hospital.latitude && hospital.longitude) {
              const dist = calculateDistance(
                  patientLat, patientLon, hospital.latitude,
                  hospital.longitude);
              if (dist < minDistance) {
                minDistance = dist;
                nearestLocation = {
                  type: 'hospital',
                  name: hospital.name,
                  distance_km: Math.round(dist * 100) / 100
                };
              }
            }
          }
        }

        // Check clinic distances
        if (doctor.clinic_id && Array.isArray(doctor.clinic_id)) {
          for (const cId of doctor.clinic_id) {
            const clinic = clinicMap[cId];
            if (clinic && clinic.latitude && clinic.longitude) {
              const dist = calculateDistance(
                  patientLat, patientLon, clinic.latitude, clinic.longitude);
              if (dist < minDistance) {
                minDistance = dist;
                nearestLocation = {
                  type: 'clinic',
                  name: clinic.name,
                  distance_km: Math.round(dist * 100) / 100
                };
              }
            }
          }
        }

        return {
          ...doctor,
          distance_km: minDistance === Infinity ?
              null :
              Math.round(minDistance * 100) / 100,
          nearest_location: nearestLocation
        };
      }));

      // Sort by distance (doctors with location first, then those without)
      doctors.sort((a, b) => {
        if (a.distance_km === null && b.distance_km === null) return 0;
        if (a.distance_km === null) return 1;
        if (b.distance_km === null) return -1;
        return a.distance_km - b.distance_km;
      });
    }

    // Calculate pagination
    const totalDoctors = doctors.length;
    const totalPages = Math.ceil(totalDoctors / limitNum);
    const skip = (pageNum - 1) * limitNum;

    // Apply pagination
    const paginatedDoctors = doctors.slice(skip, skip + limitNum);

    // Format response
    const formattedDoctors = paginatedDoctors.map(doc => {
      const result = {
        doctor_id: doc.doctor_id,
        name: `${doc.first_name} ${doc.last_name || ''}`.trim(),
        department: doc.department,
        qualifications: doc.qualifications,
        is_available: doc.is_available,
        hospitals: doc.hospitals || [],
        clinics: doc.clinics || [],
        multi_place: doc.multi_place
      };

      if (hasLocation) {
        result.distance_km = doc.distance_km;
        result.nearest_location = doc.nearest_location;
      }

      return result;
    });

    return res.json({
      status: 'success',
      page: pageNum,
      limit: limitNum,
      total_doctors: totalDoctors,
      total_pages: totalPages,
      has_next: pageNum < totalPages,
      has_prev: pageNum > 1,
      sorted_by_distance: hasLocation,
      doctors: formattedDoctors
    });

  } catch (error) {
    console.error('List doctors error:', error);
    return res.json({status: 'error', message: 'server_error'});
  }
};

module.exports = {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  listDoctors
};
