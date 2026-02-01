const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Doctor = require('./models/Doctor');
const Hospital = require('./models/Hospital');
const Clinic = require('./models/Clinic');
const DoctorSchedule = require('./models/DoctorSchedule');

const seedDoctorSchedules = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB Connected');

    // Get all doctors with their hospital/clinic assignments
    const doctors = await Doctor.find().lean();
    const hospitals = await Hospital.find().lean();
    const clinics = await Clinic.find().lean();

    if (doctors.length === 0) {
      console.log('❌ No doctors found! Please seed doctors first.');
      mongoose.connection.close();
      return;
    }

    console.log(`Found ${doctors.length} doctors, ${
        hospitals.length} hospitals, ${clinics.length} clinics`);

    // Create maps for quick lookup
    const hospitalMap = {};
    hospitals.forEach(h => {
      hospitalMap[h.hospital_id] = h.name;
    });

    const clinicMap = {};
    clinics.forEach(c => {
      clinicMap[c.clinic_id] = c.name;
    });

    // Days of the week
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const weekend = ['saturday'];
    const allDays = [...weekdays, ...weekend];

    // Time slot patterns
    const morningSlots = [
      {start: '09:00', end: '13:00'}, {start: '09:30', end: '12:30'},
      {start: '10:00', end: '13:00'}, {start: '08:00', end: '12:00'}
    ];

    const afternoonSlots = [
      {start: '14:00', end: '18:00'}, {start: '15:00', end: '19:00'},
      {start: '14:30', end: '17:30'}, {start: '16:00', end: '20:00'}
    ];

    const eveningSlots = [
      {start: '18:00', end: '21:00'}, {start: '17:00', end: '20:00'},
      {start: '19:00', end: '21:30'}
    ];

    // Helper functions
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const getRandomDays = (arr, count) => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    const schedules = [];

    for (const doctor of doctors) {
      const hospitalScheduleMap = {};
      const clinicScheduleMap = {};

      // Generate hospital schedules
      if (doctor.hospital_id && Array.isArray(doctor.hospital_id)) {
        for (const hospId of doctor.hospital_id) {
          const hospitalName = hospitalMap[hospId] || `Hospital ${hospId}`;

          // Random number of consulting days (2-4 for each hospital)
          const numDays = Math.floor(Math.random() * 3) + 2;
          const consultingDays = getRandomDays(weekdays, numDays);

          const slots = consultingDays.map(day => {
            // Randomly choose morning or afternoon
            const timeSlot = Math.random() > 0.5 ? getRandom(morningSlots) :
                                                   getRandom(afternoonSlots);
            return {
              day: day,
              start: timeSlot.start,
              end: timeSlot.end,
              slot_duration: 30,
              max_patients:
                  Math.floor(Math.random() * 3) + 3  // 3-5 patients per slot
            };
          });

          hospitalScheduleMap[hospId.toString()] = {
            location_name: hospitalName,
            slots: slots
          };
        }
      }

      // Generate clinic schedules
      if (doctor.clinic_id && Array.isArray(doctor.clinic_id)) {
        for (const clinicId of doctor.clinic_id) {
          const clinicName = clinicMap[clinicId] || `Clinic ${clinicId}`;

          // Clinics often have evening slots or weekend slots
          const numDays =
              Math.floor(Math.random() * 2) + 1;  // 1-2 days for clinics
          const consultingDays =
              getRandomDays([...weekdays, 'saturday'], numDays);

          const slots = consultingDays.map(day => {
            // Clinics often have evening slots
            const timeSlot = day === 'saturday' ? getRandom(morningSlots) :
                                                  getRandom(eveningSlots);
            return {
              day: day,
              start: timeSlot.start,
              end: timeSlot.end,
              slot_duration: 30,
              max_patients: Math.floor(Math.random() * 2) +
                  2  // 2-3 patients per slot (smaller clinics)
            };
          });

          clinicScheduleMap[clinicId.toString()] = {
            location_name: clinicName,
            slots: slots
          };
        }
      }

      schedules.push({
        doctor_id: doctor.doctor_id,
        hospital_schedule: hospitalScheduleMap,
        clinic_schedule: clinicScheduleMap
      });
    }

    // Clear existing schedules and insert new ones
    await DoctorSchedule.deleteMany({});
    console.log('Cleared existing doctor schedules');

    await DoctorSchedule.insertMany(schedules);
    console.log(`✅ Created ${schedules.length} doctor schedules`);

    // Summary
    const withHospital =
        schedules.filter(s => Object.keys(s.hospital_schedule).length > 0)
            .length;
    const withClinic =
        schedules.filter(s => Object.keys(s.clinic_schedule).length > 0).length;
    const withBoth = schedules
                         .filter(
                             s => Object.keys(s.hospital_schedule).length > 0 &&
                                 Object.keys(s.clinic_schedule).length > 0)
                         .length;

    console.log('\n========================================');
    console.log('SEED COMPLETE - SCHEDULE SUMMARY');
    console.log('========================================');
    console.log(`Total Schedules Created: ${schedules.length}`);
    console.log(`With Hospital Schedule: ${withHospital}`);
    console.log(`With Clinic Schedule: ${withClinic}`);
    console.log(`With Both: ${withBoth}`);
    console.log('========================================\n');

    mongoose.connection.close();
    console.log('Database connection closed');

  } catch (err) {
    console.error('Error seeding doctor schedules:', err);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedDoctorSchedules();
