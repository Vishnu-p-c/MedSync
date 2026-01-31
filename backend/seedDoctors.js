const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Doctor = require('./models/Doctor');
const Hospital = require('./models/Hospital');
const Clinic = require('./models/Clinic');

const seedDoctors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB Connected');

    // Get existing hospitals and clinics (with names for display)
    const hospitals = await Hospital.find().lean();
    const clinics = await Clinic.find().lean();

    if (hospitals.length === 0) {
      console.log('❌ No hospitals found! Please seed hospitals first.');
      mongoose.connection.close();
      return;
    }

    console.log(
        `Found ${hospitals.length} hospitals and ${clinics.length} clinics`);

    // Get the highest existing doctor_id
    const lastDoctor = await Doctor.findOne().sort({doctor_id: -1}).lean();
    let nextDoctorId = lastDoctor ? lastDoctor.doctor_id + 1 : 1;

    console.log(`Starting Doctor ID: ${nextDoctorId}`);

    // Hospital and Clinic data (IDs + names)
    const hospitalData =
        hospitals.map(h => ({id: h.hospital_id, name: h.name}));
    const clinicData = clinics.map(c => ({id: c.clinic_id, name: c.name}));

    // Common medical departments
    const departments = [
      'Cardiology', 'Neurology', 'Orthopedics', 'Gynecology', 'Pediatrics',
      'Dermatology', 'Ophthalmology', 'ENT', 'Psychiatry', 'Urology',
      'Nephrology', 'Gastroenterology', 'Pulmonology', 'Oncology',
      'General Medicine'
    ];

    // Kerala doctor names (first, last)
    const doctorNames = [
      // Male doctors
      {first: 'Aravind', last: 'Menon'},
      {first: 'Suresh', last: 'Nair'},
      {first: 'Rajesh', last: 'Kumar'},
      {first: 'Vinod', last: 'Pillai'},
      {first: 'Mohan', last: 'Das'},
      {first: 'Anoop', last: 'Krishnan'},
      {first: 'Sanjay', last: 'Varma'},
      {first: 'Deepak', last: 'Nambiar'},
      {first: 'Manoj', last: 'Thampi'},
      {first: 'Prasad', last: 'Iyer'},
      {first: 'Abdul', last: 'Rasheed'},
      {first: 'Mohammed', last: 'Fazil'},
      {first: 'Shameer', last: 'Ali'},
      {first: 'Navas', last: 'Koya'},
      {first: 'Rashid', last: 'Hasan'},
      {first: 'Shibu', last: 'Mathew'},
      {first: 'Thomas', last: 'Varghese'},
      {first: 'George', last: 'Philip'},
      {first: 'Joseph', last: 'Antony'},
      {first: 'Biju', last: 'Kurian'},
      // Female doctors
      {first: 'Lakshmi', last: 'Devi'},
      {first: 'Priya', last: 'Menon'},
      {first: 'Anjali', last: 'Nair'},
      {first: 'Divya', last: 'Pillai'},
      {first: 'Sreeja', last: 'Kumar'},
      {first: 'Meera', last: 'Krishnan'},
      {first: 'Deepa', last: 'Mohan'},
      {first: 'Sunitha', last: 'Raj'},
      {first: 'Remya', last: 'Suresh'},
      {first: 'Nisha', last: 'Thomas'},
      {first: 'Fathima', last: 'Beevi'},
      {first: 'Ayisha', last: 'Siddique'},
      {first: 'Shameena', last: 'Basheer'},
      {first: 'Rizwana', last: 'Khalid'},
      {first: 'Safiya', last: 'Rahman'},
      {first: 'Tessy', last: 'Joseph'},
      {first: 'Mary', last: 'Thomas'},
      {first: 'Rose', last: 'Philip'},
      {first: 'Smitha', last: 'Nambiar'},
      {first: 'Asha', last: 'Menon'},
      // Additional doctors
      {first: 'Vijay', last: 'Shankar'},
      {first: 'Ramesh', last: 'Babu'},
      {first: 'Geetha', last: 'Krishnan'},
      {first: 'Kavitha', last: 'Nair'},
      {first: 'Sathish', last: 'Kumar'}
    ];

    // Qualifications (as arrays matching schema)
    const qualificationSets = [
      ['MBBS', 'MD'], ['MBBS', 'MS'], ['MBBS', 'DM'], ['MBBS', 'MCh'],
      ['MBBS', 'DNB'], ['MBBS', 'MD', 'DM'], ['MBBS', 'MS', 'MCh'],
      ['MBBS', 'FRCS'], ['MBBS', 'MRCP']
    ];

    // Helper functions
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const getRandomItems = (arr, min, max) => {
      const count = Math.floor(Math.random() * (max - min + 1)) + min;
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, arr.length));
    };

    const doctors = [];

    // Create 45 doctors with different configurations
    for (let i = 0; i < 45; i++) {
      const nameData = doctorNames[i % doctorNames.length];
      const department = departments[i % departments.length];
      const doctorId = nextDoctorId++;

      // Determine hospital/clinic assignment based on index
      let selectedHospitals = [];
      let selectedClinics = [];

      if (i < 8) {
        // Only hospital (single) - 8 doctors
        selectedHospitals = [getRandom(hospitalData)];
      } else if (i < 16) {
        // Only clinic (single) - 8 doctors
        if (clinicData.length > 0) {
          selectedClinics = [getRandom(clinicData)];
        } else {
          selectedHospitals = [getRandom(hospitalData)];
        }
      } else if (i < 24) {
        // Both hospital and clinic - 8 doctors
        selectedHospitals = [getRandom(hospitalData)];
        if (clinicData.length > 0) {
          selectedClinics = [getRandom(clinicData)];
        }
      } else if (i < 32) {
        // Multiple hospitals - 8 doctors
        selectedHospitals = getRandomItems(hospitalData, 2, 3);
      } else if (i < 40) {
        // Multiple clinics - 8 doctors
        if (clinicData.length >= 2) {
          selectedClinics = getRandomItems(clinicData, 2, 3);
        } else if (clinicData.length > 0) {
          selectedClinics = [getRandom(clinicData)];
          selectedHospitals = [getRandom(hospitalData)];
        } else {
          selectedHospitals = getRandomItems(hospitalData, 2, 3);
        }
      } else {
        // Multiple hospitals + multiple clinics - 5 doctors
        selectedHospitals = getRandomItems(hospitalData, 2, 3);
        if (clinicData.length >= 2) {
          selectedClinics = getRandomItems(clinicData, 1, 2);
        }
      }

      // Extract IDs and names
      const hospitalIds = selectedHospitals.map(h => h.id);
      const hospitalNames = selectedHospitals.map(h => h.name);
      const clinicIds = selectedClinics.map(c => c.id);
      const clinicNames = selectedClinics.map(c => c.name);

      // Check if multi_place (works at more than one location)
      const multiPlace = (hospitalIds.length + clinicIds.length) > 1;

      // Generate MRN (Medical Registration Number)
      const mrn = `KMC${String(doctorId).padStart(5, '0')}`;

      // Create doctor matching the actual schema
      doctors.push({
        doctor_id: doctorId,
        hospital_id: hospitalIds.length > 0 ? hospitalIds : null,
        clinic_id: clinicIds.length > 0 ? clinicIds : null,
        first_name: nameData.first,
        last_name: nameData.last,
        name: `Dr. ${nameData.first} ${nameData.last}`,
        mrn: mrn,
        department: department,
        is_available: true,
        last_attendance_time: null,
        multi_place: multiPlace,
        qualifications: getRandom(qualificationSets),
        hospitals: hospitalNames,
        clinics: clinicNames
      });
    }

    // Insert doctors
    await Doctor.insertMany(doctors);
    console.log(`✅ Created ${doctors.length} doctors (IDs ${
        doctors[0].doctor_id} to ${doctors[doctors.length - 1].doctor_id})`);

    // Summary statistics
    const onlyHospital =
        doctors
            .filter(
                d => d.hospital_id && d.hospital_id.length > 0 &&
                    (!d.clinic_id || d.clinic_id.length === 0))
            .length;
    const onlyClinic =
        doctors
            .filter(
                d => d.clinic_id && d.clinic_id.length > 0 &&
                    (!d.hospital_id || d.hospital_id.length === 0))
            .length;
    const both = doctors
                     .filter(
                         d => d.hospital_id && d.hospital_id.length > 0 &&
                             d.clinic_id && d.clinic_id.length > 0)
                     .length;
    const multipleHospitals =
        doctors.filter(d => d.hospital_id && d.hospital_id.length > 1).length;
    const multipleClinics =
        doctors.filter(d => d.clinic_id && d.clinic_id.length > 1).length;
    const multiPlaceCount = doctors.filter(d => d.multi_place).length;

    console.log('\n========================================');
    console.log('SEED COMPLETE - DOCTOR SUMMARY');
    console.log('========================================');
    console.log(`Total Doctors Added: ${doctors.length}`);
    console.log(`Only Hospital: ${onlyHospital}`);
    console.log(`Only Clinic: ${onlyClinic}`);
    console.log(`Both Hospital & Clinic: ${both}`);
    console.log(`Multiple Hospitals: ${multipleHospitals}`);
    console.log(`Multiple Clinics: ${multipleClinics}`);
    console.log(`Multi-place Doctors: ${multiPlaceCount}`);
    console.log(`Departments covered: ${
            [...new Set(doctors.map(d => d.department))].join(', ')}`);
    console.log('========================================\n');

    mongoose.connection.close();
    console.log('Database connection closed');

  } catch (err) {
    console.error('Error seeding doctors:', err);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedDoctors();
