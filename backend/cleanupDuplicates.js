const mongoose = require('mongoose');
require('dotenv').config();

const Hospital = require('./models/Hospital');
const Clinic = require('./models/Clinic');
const User = require('./models/User');
const HospitalAdmin = require('./models/HospitalAdmin');

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB Connected');

    // Delete duplicate hospitals (IDs 25-44)
    const hospResult = await Hospital.deleteMany({hospital_id: {$gte: 25}});
    console.log(
        `✅ Deleted ${hospResult.deletedCount} duplicate hospitals (IDs >= 25)`);

    // Delete duplicate clinics (IDs >= 12 if any duplicates exist)
    const clinicResult = await Clinic.deleteMany({clinic_id: {$gte: 12}});
    console.log(
        `✅ Deleted ${clinicResult.deletedCount} duplicate clinics (IDs >= 12)`);

    // Delete duplicate admin users (IDs >= 72 if any duplicates exist)
    const userResult = await User.deleteMany({user_id: {$gte: 72}});
    console.log(`✅ Deleted ${
        userResult.deletedCount} duplicate admin users (IDs >= 72)`);

    // Delete duplicate hospital admin links (admin_id >= 72)
    const adminResult = await HospitalAdmin.deleteMany({admin_id: {$gte: 72}});
    console.log(`✅ Deleted ${
        adminResult.deletedCount} duplicate admin links (admin_ids >= 72)`);

    // Show current counts
    const hospCount = await Hospital.countDocuments();
    const clinicCount = await Clinic.countDocuments();
    const userCount = await User.countDocuments();
    const adminCount = await HospitalAdmin.countDocuments();

    console.log('\n========================================');
    console.log('CLEANUP COMPLETE - CURRENT COUNTS');
    console.log('========================================');
    console.log(`Hospitals: ${hospCount}`);
    console.log(`Clinics: ${clinicCount}`);
    console.log(`Users: ${userCount}`);
    console.log(`HospitalAdmins: ${adminCount}`);
    console.log('========================================\n');

    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
    mongoose.connection.close();
  }
};

cleanup();
