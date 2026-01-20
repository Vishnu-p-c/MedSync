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
    await mongoose.connect(process.env.MONGO_URL);
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

    // 1. Create Users - 5 Admins, 5 Doctors, 5 Drivers, 5 Patients
    await User.insertMany([
      // Admins (5)
      {
        user_id: 1,
        first_name: 'John',
        last_name: 'Smith',
        username: 'admin_john',
        password_hash: 'admin123',
        role: 'admin',
        email: 'admin.john@medsync.com',
        phone: '1234567890',
        date_of_birth: new Date('1985-05-15'),
        gender: 'male',
        address: '789 Admin Street, Central District',
        latitude: 40.7500,
        longitude: -74.0100
      },
      {
        user_id: 2,
        first_name: 'Thushar',
        last_name: 'Pradeep',
        username: 'thusharpraddeep',
        password_hash: 'test123',
        role: 'admin',
        email: 'thushar02.pradeep@gmail.com',
        phone: '5555555555',
        date_of_birth: new Date('2000-02-15'),
        gender: 'male',
        address: '999 Tech Park, Innovation District',
        latitude: 40.7600,
        longitude: -73.9900
      },
      {
        user_id: 3,
        first_name: 'Emily',
        last_name: 'Davis',
        username: 'admin_emily',
        password_hash: 'admin123',
        role: 'admin',
        email: 'emily.davis@medsync.com',
        phone: '1112223333',
        date_of_birth: new Date('1987-09-20'),
        gender: 'female',
        address: '456 Executive Lane, Business District',
        latitude: 40.7450,
        longitude: -74.0150
      },
      {
        user_id: 4,
        first_name: 'Robert',
        last_name: 'Chen',
        username: 'admin_robert',
        password_hash: 'admin123',
        role: 'admin',
        email: 'robert.chen@medsync.com',
        phone: '2223334444',
        date_of_birth: new Date('1982-03-12'),
        gender: 'male',
        address: '321 Management St, Corporate Plaza',
        latitude: 40.7550,
        longitude: -74.0050
      },
      {
        user_id: 5,
        first_name: 'Maria',
        last_name: 'Rodriguez',
        username: 'admin_maria',
        password_hash: 'admin123',
        role: 'admin',
        email: 'maria.rodriguez@medsync.com',
        phone: '3334445555',
        date_of_birth: new Date('1990-07-08'),
        gender: 'female',
        address: '789 Leadership Blvd, Admin Center',
        latitude: 40.7480,
        longitude: -74.0120
      },

      // Doctors (5)
      {
        user_id: 6,
        first_name: 'Sarah',
        last_name: 'Johnson',
        username: 'dr_sarah',
        password_hash: 'doctor123',
        role: 'doctor',
        email: 'dr.sarah@medsync.com',
        phone: '2345678901',
        date_of_birth: new Date('1988-08-22'),
        gender: 'female',
        address: '456 Medical Plaza, Downtown',
        latitude: 40.7400,
        longitude: -74.0200
      },
      {
        user_id: 7,
        first_name: 'David',
        last_name: 'Kumar',
        username: 'dr_david',
        password_hash: 'doctor123',
        role: 'doctor',
        email: 'dr.david@medsync.com',
        phone: '4445556666',
        date_of_birth: new Date('1985-04-15'),
        gender: 'male',
        address: '123 Hospital Ave, Medical District',
        latitude: 40.7420,
        longitude: -74.0180
      },
      {
        user_id: 8,
        first_name: 'Lisa',
        last_name: 'Thompson',
        username: 'dr_lisa',
        password_hash: 'doctor123',
        role: 'doctor',
        email: 'dr.lisa@medsync.com',
        phone: '5556667777',
        date_of_birth: new Date('1992-11-30'),
        gender: 'female',
        address: '789 Clinic Road, Healthcare Center',
        latitude: 40.7390,
        longitude: -74.0210
      },
      {
        user_id: 9,
        first_name: 'James',
        last_name: 'Lee',
        username: 'dr_james',
        password_hash: 'doctor123',
        role: 'doctor',
        email: 'dr.james@medsync.com',
        phone: '6667778888',
        date_of_birth: new Date('1983-06-18'),
        gender: 'male',
        address: '456 Surgery Lane, Medical Complex',
        latitude: 40.7410,
        longitude: -74.0190
      },
      {
        user_id: 10,
        first_name: 'Anna',
        last_name: 'Martinez',
        username: 'dr_anna',
        password_hash: 'doctor123',
        role: 'doctor',
        email: 'dr.anna@medsync.com',
        phone: '7778889999',
        date_of_birth: new Date('1989-02-25'),
        gender: 'female',
        address: '321 Emergency Rd, ER Center',
        latitude: 40.7430,
        longitude: -74.0170
      },

      // Drivers (5)
      {
        user_id: 11,
        first_name: 'Mike',
        last_name: 'Anderson',
        username: 'driver_mike',
        password_hash: 'driver123',
        role: 'driver',
        email: 'driver.mike@medsync.com',
        phone: '3456789012',
        date_of_birth: new Date('1990-03-10'),
        gender: 'male',
        address: '321 Driver Lane, East Side',
        latitude: 40.7350,
        longitude: -74.0050
      },
      {
        user_id: 12,
        first_name: 'Tom',
        last_name: 'Wilson',
        username: 'driver_tom',
        password_hash: 'driver123',
        role: 'driver',
        email: 'driver.tom@medsync.com',
        phone: '8889990000',
        date_of_birth: new Date('1987-12-05'),
        gender: 'male',
        address: '654 Ambulance St, Dispatch Center',
        latitude: 40.7360,
        longitude: -74.0060
      },
      {
        user_id: 13,
        first_name: 'Carlos',
        last_name: 'Garcia',
        username: 'driver_carlos',
        password_hash: 'driver123',
        role: 'driver',
        email: 'driver.carlos@medsync.com',
        phone: '9990001111',
        date_of_birth: new Date('1993-08-14'),
        gender: 'male',
        address: '987 Rescue Ave, Emergency Zone',
        latitude: 40.7340,
        longitude: -74.0070
      },
      {
        user_id: 14,
        first_name: 'Ahmed',
        last_name: 'Hassan',
        username: 'driver_ahmed',
        password_hash: 'driver123',
        role: 'driver',
        email: 'driver.ahmed@medsync.com',
        phone: '1011121314',
        date_of_birth: new Date('1991-05-20'),
        gender: 'male',
        address: '234 Response Rd, EMT Station',
        latitude: 40.7370,
        longitude: -74.0040
      },
      {
        user_id: 15,
        first_name: 'Kevin',
        last_name: 'Brown',
        username: 'driver_kevin',
        password_hash: 'driver123',
        role: 'driver',
        email: 'driver.kevin@medsync.com',
        phone: '1415161718',
        date_of_birth: new Date('1988-09-28'),
        gender: 'male',
        address: '567 Fleet St, Vehicle Center',
        latitude: 40.7380,
        longitude: -74.0030
      },

      // Patients (5)
      {
        user_id: 16,
        first_name: 'Jane',
        last_name: 'Williams',
        username: 'patient_jane',
        password_hash: 'patient123',
        role: 'patient',
        email: 'patient.jane@medsync.com',
        phone: '4567890123',
        date_of_birth: new Date('1995-11-30'),
        gender: 'female',
        address: '123 Residential Ave, West End, Apartment 4B',
        latitude: 40.7200,
        longitude: -74.0100
      },
      {
        user_id: 17,
        first_name: 'Michael',
        last_name: 'Taylor',
        username: 'patient_michael',
        password_hash: 'patient123',
        role: 'patient',
        email: 'michael.taylor@email.com',
        phone: '1819202122',
        date_of_birth: new Date('1998-01-12'),
        gender: 'male',
        address: '789 Oak Street, Suburb Area, House 12',
        latitude: 40.7210,
        longitude: -74.0090
      },
      {
        user_id: 18,
        first_name: 'Jennifer',
        last_name: 'White',
        username: 'patient_jennifer',
        password_hash: 'patient123',
        role: 'patient',
        email: 'jennifer.white@email.com',
        phone: '2223242526',
        date_of_birth: new Date('1992-06-25'),
        gender: 'female',
        address: '456 Pine Road, Residential Complex, Unit 8A',
        latitude: 40.7190,
        longitude: -74.0110
      },
      {
        user_id: 19,
        first_name: 'Daniel',
        last_name: 'Moore',
        username: 'patient_daniel',
        password_hash: 'patient123',
        role: 'patient',
        email: 'daniel.moore@email.com',
        phone: '2728293031',
        date_of_birth: new Date('1985-10-08'),
        gender: 'male',
        address: '321 Maple Ave, Downtown, Apartment 5C',
        latitude: 40.7220,
        longitude: -74.0080
      },
      {
        user_id: 20,
        first_name: 'Sophia',
        last_name: 'Anderson',
        username: 'patient_sophia',
        password_hash: 'patient123',
        role: 'patient',
        email: 'sophia.anderson@email.com',
        phone: '3233343536',
        date_of_birth: new Date('2001-03-17'),
        gender: 'female',
        address: '654 Elm Street, City Center, Flat 3B',
        latitude: 40.7230,
        longitude: -74.0070
      }
    ]);
    console.log(
        '✅ Created 20 users (5 admins, 5 doctors, 5 drivers, 5 patients)');

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
      hospital_id: [1],
      first_name: 'Sarah',
      last_name: 'Johnson',
      mrn: 'MRN-0002',
      qualifications: ['MBBS'],
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
