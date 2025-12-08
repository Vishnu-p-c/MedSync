const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('./models/User');
const Hospital = require('./models/Hospital');
const HospitalAdmin = require('./models/HospitalAdmin');
const DoctorDetails = require('./models/Doctor');
const DoctorAttendanceLog = require('./models/DoctorAttendanceLog');
const MedicineStock = require('./models/Stock');
const EquipmentStatus = require('./models/Equipment');
const AmbulanceDriver = require('./models/AmbulanceDriver');
const AmbulanceLiveLocation = require('./models/AmbulanceLiveLocation');
const SosRequest = require('./models/SosRequest');
const AmbulanceAssignment = require('./models/AmbulanceAssignment');
const Appointment = require('./models/Appointment');
const InterHospitalMessage = require('./models/InterHospitalMessage');
const HospitalRushLog = require('./models/Rush');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Clear existing data
    await User.deleteMany({});
    await Hospital.deleteMany({});
    await HospitalAdmin.deleteMany({});
    await DoctorDetails.deleteMany({});
    await DoctorAttendanceLog.deleteMany({});
    await MedicineStock.deleteMany({});
    await EquipmentStatus.deleteMany({});
    await AmbulanceDriver.deleteMany({});
    await AmbulanceLiveLocation.deleteMany({});
    await SosRequest.deleteMany({});
    await AmbulanceAssignment.deleteMany({});
    await Appointment.deleteMany({});
    await InterHospitalMessage.deleteMany({});
    await HospitalRushLog.deleteMany({});
    console.log('Cleared all existing data');

    // 1. Create Users
    await User.insertMany([
      {
        user_id: 1,
        username: 'admin_john',
        password_hash: 'admin123',
        role: 'admin',
        email: 'admin.john@medsync.com',
        phone: '1234567890'
      },
      {
        user_id: 2,
        username: 'dr_sarah',
        password_hash: 'doctor123',
        role: 'doctor',
        email: 'dr.sarah@medsync.com',
        phone: '2345678901'
      },
      {
        user_id: 3,
        username: 'driver_mike',
        password_hash: 'driver123',
        role: 'driver',
        email: 'driver.mike@medsync.com',
        phone: '3456789012'
      },
      {
        user_id: 4,
        username: 'patient_jane',
        password_hash: 'patient123',
        role: 'patient',
        email: 'patient.jane@medsync.com',
        phone: '4567890123'
      },
      {
        user_id: 5,
        username: 'thusharpradeep',
        password_hash: 'test123',
        role: 'admin',
        email: 'thushar02.pradeep@gmail.com',
        phone: '5555555555'
      }
    ]);
    console.log('✅ Created 5 users');

    // 2. Create Hospitals
    await Hospital.insertMany([
      {
        hospital_id: 1,
        name: 'City General Hospital',
        address: '123 Main Street, Downtown',
        latitude: 40.7128,
        longitude: -74.0060,
        rush_level: 'medium'
      },
      {
        hospital_id: 2,
        name: 'Memorial Medical Center',
        address: '456 Oak Avenue, Uptown',
        latitude: 40.7580,
        longitude: -73.9855,
        rush_level: 'low'
      }
    ]);
    console.log('✅ Created 2 hospitals');

    // 3. Create Hospital Admins
    await HospitalAdmin.insertMany([
      {admin_id: 1, hospital_id: 1}, {admin_id: 5, hospital_id: 1},
      {admin_id: 5, hospital_id: 2}
    ]);
    console.log('✅ Created hospital admin links');

    // 4. Create Doctor Details
    await DoctorDetails.insertMany([{
      doctor_id: 2,
      hospital_id: 1,
      name: 'Dr. Sarah Johnson',
      department: 'Emergency',
      is_available: true,
      last_attendance_time: new Date()
    }]);
    console.log('✅ Created doctor details');

    // 5. Create Doctor Attendance Log
    await DoctorAttendanceLog.insertMany(
        [{log_id: 1, doctor_id: 2, hospital_id: 1, timestamp: new Date()}]);
    console.log('✅ Created doctor attendance log');

    // 6. Create Medicine Stock
    await MedicineStock.insertMany([
      {stock_id: 1, hospital_id: 1, item_name: 'Paracetamol', quantity: 500},
      {stock_id: 2, hospital_id: 1, item_name: 'Ibuprofen', quantity: 300},
      {stock_id: 3, hospital_id: 2, item_name: 'Amoxicillin', quantity: 200}
    ]);
    console.log('✅ Created medicine stock');

    // 7. Create Equipment Status
    await EquipmentStatus.insertMany([
      {
        equipment_id: 1,
        hospital_id: 1,
        equipment_name: 'MRI Machine',
        status: 'working'
      },
      {
        equipment_id: 2,
        hospital_id: 1,
        equipment_name: 'X-Ray Machine',
        status: 'maintenance'
      },
      {
        equipment_id: 3,
        hospital_id: 2,
        equipment_name: 'CT Scanner',
        status: 'working'
      }
    ]);
    console.log('✅ Created equipment status');

    // 8. Create Ambulance Drivers
    await AmbulanceDriver.insertMany([{
      driver_id: 3,
      name: 'Mike Anderson',
      license_number: 'DL123456',
      vehicle_number: 'AMB-001',
      added_by_hospital_id: 1,
      is_active: true
    }]);
    console.log('✅ Created ambulance driver');

    // 9. Create Ambulance Live Location
    await AmbulanceLiveLocation.insertMany([{
      driver_id: 3,
      latitude: 40.7300,
      longitude: -74.0000,
      updated_at: new Date()
    }]);
    console.log('✅ Created ambulance live location');

    // 10. Create SOS Request
    await SosRequest.insertMany([{
      sos_id: 1,
      patient_id: 4,
      latitude: 40.7200,
      longitude: -74.0100,
      severity: 'critical',
      status: 'assigned',
      assigned_driver_id: 3,
      assigned_hospital_id: 1
    }]);
    console.log('✅ Created SOS request');

    // 11. Create Ambulance Assignment
    await AmbulanceAssignment.insertMany([{
      assignment_id: 1,
      sos_id: 1,
      driver_id: 3,
      assigned_hospital_id: 1,
      route_eta: 15,
      is_completed: false
    }]);
    console.log('✅ Created ambulance assignment');

    // 12. Create Appointment
    await Appointment.insertMany([{
      appointment_id: 1,
      patient_id: 4,
      doctor_id: 2,
      hospital_id: 1,
      appointment_time: new Date(Date.now() + 86400000),  // Tomorrow
      status: 'upcoming'
    }]);
    console.log('✅ Created appointment');

    // 13. Create Inter-Hospital Message
    await InterHospitalMessage.insertMany([{
      message_id: 1,
      from_hospital_id: 1,
      to_hospital_id: 2,
      message: 'Can you accept 2 critical patients? Our ER is at capacity.',
      timestamp: new Date()
    }]);
    console.log('✅ Created inter-hospital message');

    // 14. Create Hospital Rush Log
    await HospitalRushLog.insertMany([
      {log_id: 1, hospital_id: 1, rush_level: 'medium', timestamp: new Date()}
    ]);
    console.log('✅ Created hospital rush log');

    console.log('\n🎉 Sample database seeded successfully!');
    console.log('\nTest login credentials:');
    console.log('- Admin: username: thusharpradeep, password: test123');
    console.log('  Email: thushar02.pradeep@gmail.com');
    console.log('- Admin: username: admin_john, password: admin123');
    console.log('- Doctor: username: dr_sarah, password: doctor123');
    console.log('- Driver: username: driver_mike, password: driver123');
    console.log('- Patient: username: patient_jane, password: patient123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
