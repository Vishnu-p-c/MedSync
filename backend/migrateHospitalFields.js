require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Hospital = require('./models/Hospital');

/**
 * Migration script to add NFC_SNO and spass fields to existing hospitals
 * Run this once to update all existing hospital records
 */
const migrateHospitalFields = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB Connected');

    // Hash the hospital password
    const salt = await bcrypt.genSalt(10);
    const hospitalPasswordHash = await bcrypt.hash('hospital123', salt);
    console.log('Hospital password hashed');

    // Find all hospitals
    const hospitals = await Hospital.find({});
    console.log(`Found ${hospitals.length} hospitals in database`);

    let updatedCount = 0;
    let alreadyHadFieldsCount = 0;

    for (const hospital of hospitals) {
      let needsUpdate = false;
      const updateFields = {};

      // Check if NFC_SNO field is missing
      if (hospital.NFC_SNO === undefined) {
        updateFields.NFC_SNO = null;
        needsUpdate = true;
      }

      // Check if spass field is missing
      if (hospital.spass === undefined) {
        updateFields.spass = hospitalPasswordHash;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Hospital.updateOne(
            {hospital_id: hospital.hospital_id}, {$set: updateFields});
        updatedCount++;
        console.log(
            `✅ Updated hospital_id ${hospital.hospital_id}: ${hospital.name}`);
      } else {
        alreadyHadFieldsCount++;
      }
    }

    console.log('\n========================================');
    console.log('HOSPITAL MIGRATION COMPLETE');
    console.log('========================================');
    console.log(`Total hospitals:              ${hospitals.length}`);
    console.log(`Updated with new fields:      ${updatedCount}`);
    console.log(`Already had fields (skipped): ${alreadyHadFieldsCount}`);
    console.log(`\nNew fields added:`);
    console.log(`  - NFC_SNO: null (default)`);
    console.log(`  - spass: hashed "hospital123"`);
    console.log('========================================\n');

    mongoose.connection.close();
    console.log('Database connection closed');

  } catch (err) {
    console.error('❌ Error migrating hospital fields:', err);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run migration
migrateHospitalFields();
