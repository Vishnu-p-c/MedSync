require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Hospital = require('./models/Hospital');
const Clinic = require('./models/Clinic');

/**
 * Migration script to:
 * 1. Remove default_schedule from all hospitals
 * 2. Add NFC_SNO and spass fields to all hospitals
 * 3. Remove default_schedule from all clinics
 * 4. Add NFC_SNO and spass fields to all clinics
 * Run this once to update all existing records
 */
const migrateHospitalAndClinicFields = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB Connected');

    // Hash the passwords
    const salt = await bcrypt.genSalt(10);
    const hospitalPasswordHash = await bcrypt.hash('hospital123', salt);
    const clinicPasswordHash = await bcrypt.hash('clinic123', salt);
    console.log('Passwords hashed');

    // ========================================================================
    // MIGRATE HOSPITALS
    // ========================================================================
    const hospitals = await Hospital.find({});
    console.log(`\nFound ${hospitals.length} hospitals in database`);

    let hospitalUpdatedCount = 0;
    let hospitalAlreadyCleanCount = 0;

    for (const hospital of hospitals) {
      const updateFields = {};
      const unsetFields = {};
      let needsUpdate = false;

      // Remove default_schedule if it exists
      if (hospital.default_schedule !== undefined) {
        unsetFields.default_schedule = '';
        needsUpdate = true;
      }

      // Add NFC_SNO if missing
      if (hospital.NFC_SNO === undefined) {
        updateFields.NFC_SNO = null;
        needsUpdate = true;
      }

      // Add spass if missing
      if (hospital.spass === undefined) {
        updateFields.spass = hospitalPasswordHash;
        needsUpdate = true;
      }

      if (needsUpdate) {
        const updateOperation = {};
        if (Object.keys(updateFields).length > 0) {
          updateOperation.$set = updateFields;
        }
        if (Object.keys(unsetFields).length > 0) {
          updateOperation.$unset = unsetFields;
        }

        await Hospital.updateOne(
            {hospital_id: hospital.hospital_id}, updateOperation);
        hospitalUpdatedCount++;
        console.log(
            `✅ Updated hospital_id ${hospital.hospital_id}: ${hospital.name}`);
      } else {
        hospitalAlreadyCleanCount++;
      }
    }

    // ========================================================================
    // MIGRATE CLINICS
    // ========================================================================
    const clinics = await Clinic.find({});
    console.log(`\nFound ${clinics.length} clinics in database`);

    let clinicUpdatedCount = 0;
    let clinicAlreadyCleanCount = 0;

    for (const clinic of clinics) {
      const updateFields = {};
      const unsetFields = {};
      let needsUpdate = false;

      // Remove default_schedule if it exists
      if (clinic.default_schedule !== undefined) {
        unsetFields.default_schedule = '';
        needsUpdate = true;
      }

      // Add NFC_SNO if missing
      if (clinic.NFC_SNO === undefined) {
        updateFields.NFC_SNO = null;
        needsUpdate = true;
      }

      // Add spass if missing
      if (clinic.spass === undefined) {
        updateFields.spass = clinicPasswordHash;
        needsUpdate = true;
      }

      if (needsUpdate) {
        const updateOperation = {};
        if (Object.keys(updateFields).length > 0) {
          updateOperation.$set = updateFields;
        }
        if (Object.keys(unsetFields).length > 0) {
          updateOperation.$unset = unsetFields;
        }

        await Clinic.updateOne({clinic_id: clinic.clinic_id}, updateOperation);
        clinicUpdatedCount++;
        console.log(`✅ Updated clinic_id ${clinic.clinic_id}: ${clinic.name}`);
      } else {
        clinicAlreadyCleanCount++;
      }
    }

    console.log('\n========================================');
    console.log('MIGRATION COMPLETE');
    console.log('========================================');
    console.log(`\nHOSPITALS:`);
    console.log(`  Total hospitals:              ${hospitals.length}`);
    console.log(`  Updated:                      ${hospitalUpdatedCount}`);
    console.log(`  Already clean (skipped):      ${hospitalAlreadyCleanCount}`);
    console.log(`\nCLINICS:`);
    console.log(`  Total clinics:                ${clinics.length}`);
    console.log(`  Updated:                      ${clinicUpdatedCount}`);
    console.log(`  Already clean (skipped):      ${clinicAlreadyCleanCount}`);
    console.log(`\nChanges applied:`);
    console.log(`  ✓ Removed default_schedule field`);
    console.log(`  ✓ Added NFC_SNO: null`);
    console.log(
        `  ✓ Added spass (hospital123 for hospitals, clinic123 for clinics)`);
    console.log('========================================\n');

    mongoose.connection.close();
    console.log('Database connection closed');

  } catch (err) {
    console.error('❌ Error migrating fields:', err);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run migration
migrateHospitalAndClinicFields();
