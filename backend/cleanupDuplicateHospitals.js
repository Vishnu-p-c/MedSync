const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const DoctorDetails = require('./models/Doctor');
const HospitalAdmin = require('./models/HospitalAdmin');
const SosRequest = require('./models/SosRequest');
const Appointment = require('./models/Appointment');
const DoctorSchedule = require('./models/DoctorSchedule');
const Rush = require('./models/Rush');

// Load environment variables
require('dotenv').config();

const cleanupDuplicateHospitals = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find all hospitals
    console.log('📋 Fetching all hospitals...');
    const allHospitals = await Hospital.find({}).sort({hospital_id: 1});
    console.log(`Found ${allHospitals.length} hospitals\n`);

    // Step 2: Group hospitals by name (case-insensitive)
    const hospitalGroups = {};
    allHospitals.forEach(hospital => {
      const normalizedName = hospital.name.trim().toLowerCase();
      if (!hospitalGroups[normalizedName]) {
        hospitalGroups[normalizedName] = [];
      }
      hospitalGroups[normalizedName].push(hospital);
    });

    // Step 3: Find duplicates
    const duplicateGroups =
        Object.entries(hospitalGroups).filter(([
                                                name, hospitals
                                              ]) => hospitals.length > 1);

    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicate hospitals found. Database is clean!');
      await mongoose.connection.close();
      return;
    }

    console.log(
        `🔍 Found ${duplicateGroups.length} duplicate hospital names:\n`);

    let totalMerged = 0;
    let totalDeleted = 0;

    // Step 4: Process each duplicate group
    for (const [normalizedName, hospitals] of duplicateGroups) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📍 Processing: "${hospitals[0].name}"`);
      console.log(`   Found ${hospitals.length} duplicates`);

      // Sort by hospital_id (ascending) - keep the oldest one
      hospitals.sort((a, b) => a.hospital_id - b.hospital_id);

      const keepHospital = hospitals[0];
      const duplicateHospitals = hospitals.slice(1);

      console.log(`   ✓ Keeping: ID ${keepHospital.hospital_id} (${
          keepHospital.name})`);
      console.log(`   ✗ Removing: ${
          duplicateHospitals.map(h => `ID ${h.hospital_id}`).join(', ')}`);

      for (const duplicateHospital of duplicateHospitals) {
        const dupId = duplicateHospital.hospital_id;

        // Update DoctorDetails - replace hospital_id in arrays
        const doctorsWithDup = await DoctorDetails.find({hospital_id: dupId});
        for (const doctor of doctorsWithDup) {
          // Remove duplicate ID
          doctor.hospital_id = doctor.hospital_id.filter(id => id !== dupId);

          // Add keep ID if not already present
          if (!doctor.hospital_id.includes(keepHospital.hospital_id)) {
            doctor.hospital_id.push(keepHospital.hospital_id);
          }

          // Update hospital_attendance Map
          if (doctor.hospital_attendance &&
              doctor.hospital_attendance.has(dupId.toString())) {
            const attendanceData =
                doctor.hospital_attendance.get(dupId.toString());
            // Move attendance data to kept hospital if it doesn't exist
            if (!doctor.hospital_attendance.has(
                    keepHospital.hospital_id.toString())) {
              doctor.hospital_attendance.set(
                  keepHospital.hospital_id.toString(), attendanceData);
            }
            doctor.hospital_attendance.delete(dupId.toString());
          }

          // Update current_hospital_id if it points to duplicate
          if (doctor.current_hospital_id === dupId) {
            doctor.current_hospital_id = keepHospital.hospital_id;
          }

          await doctor.save();
        }
        if (doctorsWithDup.length > 0) {
          console.log(`   ↳ Updated ${doctorsWithDup.length} doctor records`);
        }

        // Update HospitalAdmin - replace hospital_id
        const adminsUpdated = await HospitalAdmin.updateMany(
            {hospital_id: dupId},
            {$set: {hospital_id: keepHospital.hospital_id}});
        if (adminsUpdated.modifiedCount > 0) {
          console.log(`   ↳ Updated ${
              adminsUpdated.modifiedCount} hospital admin records`);
        }

        // Update SosRequest - replace assigned_hospital_id
        const sosUpdated = await SosRequest.updateMany(
            {assigned_hospital_id: dupId},
            {$set: {assigned_hospital_id: keepHospital.hospital_id}});
        if (sosUpdated.modifiedCount > 0) {
          console.log(
              `   ↳ Updated ${sosUpdated.modifiedCount} SOS request records`);
        }

        // Update Appointment - replace location_id where location_type is
        // 'hospital'
        const appointmentsUpdated = await Appointment.updateMany(
            {location_type: 'hospital', location_id: dupId},
            {$set: {location_id: keepHospital.hospital_id}});
        if (appointmentsUpdated.modifiedCount > 0) {
          console.log(`   ↳ Updated ${
              appointmentsUpdated.modifiedCount} appointment records`);
        }

        // Update DoctorSchedule - replace keys in hospital_schedule Map
        const schedulesWithDup = await DoctorSchedule.find(
            {[`hospital_schedule.${dupId}`]: {$exists: true}});
        for (const schedule of schedulesWithDup) {
          if (schedule.hospital_schedule.has(dupId.toString())) {
            const scheduleData =
                schedule.hospital_schedule.get(dupId.toString());
            // Move schedule to kept hospital if it doesn't exist
            if (!schedule.hospital_schedule.has(
                    keepHospital.hospital_id.toString())) {
              schedule.hospital_schedule.set(
                  keepHospital.hospital_id.toString(), scheduleData);
            }
            schedule.hospital_schedule.delete(dupId.toString());
            await schedule.save();
          }
        }
        if (schedulesWithDup.length > 0) {
          console.log(`   ↳ Updated ${
              schedulesWithDup.length} doctor schedule records`);
        }

        // Update Rush - replace facility_id where facility_type is 'hospital'
        const rushUpdated = await Rush.updateMany(
            {facility_type: 'hospital', facility_id: dupId},
            {$set: {facility_id: keepHospital.hospital_id}});
        if (rushUpdated.modifiedCount > 0) {
          console.log(
              `   ↳ Updated ${rushUpdated.modifiedCount} rush level records`);
        }

        // Delete duplicate hospital
        await Hospital.deleteOne({hospital_id: dupId});
        console.log(`   ✓ Deleted duplicate hospital ID ${dupId}`);
        totalDeleted++;
      }

      totalMerged++;
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n✅ Cleanup Complete!`);
    console.log(`   📊 Merged ${totalMerged} duplicate hospital groups`);
    console.log(`   🗑️  Deleted ${totalDeleted} duplicate records`);
    console.log(`   ✓ All references updated successfully\n`);

    // Verify final count
    const finalCount = await Hospital.countDocuments();
    console.log(`📋 Final hospital count: ${finalCount}\n`);

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the cleanup
cleanupDuplicateHospitals();
