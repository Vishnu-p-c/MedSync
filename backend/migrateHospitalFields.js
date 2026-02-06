require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Hospital = require('./models/Hospital');
const Clinic = require('./models/Clinic');

/**
 * Migration script to:
 * 1. Remove default_schedule from all hospitals and clinics
 * 2. Add NFC_SNO and spass fields to all hospitals and clinics
 *
 * Uses raw MongoDB operations to bypass Mongoose schema defaults
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
    // MIGRATE HOSPITALS - using updateMany for efficiency
    // ========================================================================
    console.log('\n--- MIGRATING HOSPITALS ---');

    // Count hospitals
    const hospitalCount = await Hospital.countDocuments({});
    console.log(`Total hospitals in database: ${hospitalCount}`);

    // Remove default_schedule from all hospitals
    const removeScheduleResult = await Hospital.updateMany(
        {default_schedule: {$exists: true}}, {$unset: {default_schedule: ''}});
    console.log(`✅ Removed default_schedule from ${
        removeScheduleResult.modifiedCount} hospitals`);

    // Add NFC_SNO to hospitals that don't have it
    const addNfcResult = await Hospital.updateMany(
        {NFC_SNO: {$exists: false}}, {$set: {NFC_SNO: null}});
    console.log(`✅ Added NFC_SNO to ${addNfcResult.modifiedCount} hospitals`);

    // Add spass to hospitals that don't have it
    const addSpassResult = await Hospital.updateMany(
        {spass: {$exists: false}}, {$set: {spass: hospitalPasswordHash}});
    console.log(`✅ Added spass to ${addSpassResult.modifiedCount} hospitals`);

    // ========================================================================
    // MIGRATE CLINICS - using updateMany for efficiency
    // ========================================================================
    console.log('\n--- MIGRATING CLINICS ---');

    // Count clinics
    const clinicCount = await Clinic.countDocuments({});
    console.log(`Total clinics in database: ${clinicCount}`);

    // Remove default_schedule from all clinics
    const removeClinicScheduleResult = await Clinic.updateMany(
        {default_schedule: {$exists: true}}, {$unset: {default_schedule: ''}});
    console.log(`✅ Removed default_schedule from ${
        removeClinicScheduleResult.modifiedCount} clinics`);

    // Add NFC_SNO to clinics that don't have it
    const addClinicNfcResult = await Clinic.updateMany(
        {NFC_SNO: {$exists: false}}, {$set: {NFC_SNO: null}});
    console.log(
        `✅ Added NFC_SNO to ${addClinicNfcResult.modifiedCount} clinics`);

    // Add spass to clinics that don't have it
    const addClinicSpassResult = await Clinic.updateMany(
        {spass: {$exists: false}}, {$set: {spass: clinicPasswordHash}});
    console.log(
        `✅ Added spass to ${addClinicSpassResult.modifiedCount} clinics`);

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n========================================');
    console.log('MIGRATION COMPLETE');
    console.log('========================================');
    console.log(`\nHOSPITALS (${hospitalCount} total):`);
    console.log(
        `  default_schedule removed: ${removeScheduleResult.modifiedCount}`);
    console.log(`  NFC_SNO added:            ${addNfcResult.modifiedCount}`);
    console.log(`  spass added:              ${addSpassResult.modifiedCount}`);
    console.log(`\nCLINICS (${clinicCount} total):`);
    console.log(`  default_schedule removed: ${
        removeClinicScheduleResult.modifiedCount}`);
    console.log(
        `  NFC_SNO added:            ${addClinicNfcResult.modifiedCount}`);
    console.log(
        `  spass added:              ${addClinicSpassResult.modifiedCount}`);
    console.log(`\nPasswords used:`);
    console.log(`  Hospital spass: hospital123`);
    console.log(`  Clinic spass:   clinic123`);
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
