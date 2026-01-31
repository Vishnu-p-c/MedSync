const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Clinic = require('./models/Clinic');
const HospitalAdmin = require('./models/HospitalAdmin');

const seedHospitalsAndClinics = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB Connected');

    // Get the highest existing IDs to continue from there
    const lastUser = await User.findOne().sort({user_id: -1}).lean();
    const lastHospital =
        await Hospital.findOne().sort({hospital_id: -1}).lean();
    const lastClinic = await Clinic.findOne().sort({clinic_id: -1}).lean();

    let nextUserId = lastUser ? lastUser.user_id + 1 : 1;
    let nextHospitalId = lastHospital ? lastHospital.hospital_id + 1 : 1;
    let nextClinicId = lastClinic ? lastClinic.clinic_id + 1 : 1;

    console.log(`Starting IDs - User: ${nextUserId}, Hospital: ${
        nextHospitalId}, Clinic: ${nextClinicId}`);

    // ========================================================================
    // HOSPITALS - Kozhikode & Malappuram Districts (20 hospitals)
    // Names slightly modified to avoid trademark issues
    // ========================================================================
    const hospitalsData = [
      // Kozhikode District Hospitals
      {
        name: 'Aster Medcity Kozhikode',
        address: 'Chevayur, Kozhikode, Kerala 673017',
        latitude: 11.2867,
        longitude: 75.7873
      },
      {
        name: 'Meditrina Healthcare',
        address: 'Palazhi, Kozhikode, Kerala 673011',
        latitude: 11.2589,
        longitude: 75.7804
      },
      {
        name: 'Kozhikode Govt Medical College',
        address: 'Medical College PO, Kozhikode, Kerala 673008',
        latitude: 11.2615,
        longitude: 75.7866
      },
      {
        name: 'PVS Memorial Hospital',
        address: 'Beach Road, Kozhikode, Kerala 673032',
        latitude: 11.2545,
        longitude: 75.7712
      },
      {
        name: 'Starcare Hospital',
        address: 'Thondayad, Kozhikode, Kerala 673017',
        latitude: 11.2756,
        longitude: 75.8012
      },
      {
        name: 'KMC Speciality Hospital',
        address: 'Eranhipalam, Kozhikode, Kerala 673006',
        latitude: 11.2634,
        longitude: 75.7756
      },
      {
        name: 'Westfort Hi-Tech Hospital',
        address: 'Westhill, Kozhikode, Kerala 673005',
        latitude: 11.2423,
        longitude: 75.7645
      },
      {
        name: 'Ananthapuri Healthcare',
        address: 'Nadakkavu, Kozhikode, Kerala 673011',
        latitude: 11.2678,
        longitude: 75.7823
      },
      {
        name: 'Metro Medicare Hospital',
        address: 'Mankavu, Kozhikode, Kerala 673007',
        latitude: 11.2712,
        longitude: 75.7934
      },
      {
        name: 'National Hospital Kozhikode',
        address: 'Kottooli, Kozhikode, Kerala 673016',
        latitude: 11.2489,
        longitude: 75.7567
      },
      // Malappuram District Hospitals
      {
        name: 'MES Medical College Hospital',
        address: 'Perinthalmanna, Malappuram, Kerala 679322',
        latitude: 10.9756,
        longitude: 76.2234
      },
      {
        name: 'Iqraa International Hospital',
        address: 'Calicut Road, Malappuram, Kerala 676505',
        latitude: 11.0412,
        longitude: 76.0789
      },
      {
        name: 'Al Shifa Hospital Perinthalmanna',
        address: 'Perinthalmanna, Malappuram, Kerala 679322',
        latitude: 10.9823,
        longitude: 76.2145
      },
      {
        name: 'KIMS Al Shifa Perinthalmanna',
        address: 'Kizhattur, Perinthalmanna, Kerala 679325',
        latitude: 10.9912,
        longitude: 76.2312
      },
      {
        name: 'Tirur Govt Hospital',
        address: 'Tirur, Malappuram, Kerala 676101',
        latitude: 10.9134,
        longitude: 75.9234
      },
      {
        name: 'District Hospital Manjeri',
        address: 'Manjeri, Malappuram, Kerala 676121',
        latitude: 11.1198,
        longitude: 76.1234
      },
      {
        name: 'Mercy Hospital Manjeri',
        address: 'Manjeri Town, Malappuram, Kerala 676121',
        latitude: 11.1234,
        longitude: 76.1189
      },
      {
        name: 'Malabar Hospital Ponnani',
        address: 'Ponnani, Malappuram, Kerala 679577',
        latitude: 10.7678,
        longitude: 75.9234
      },
      {
        name: 'Kondotty Taluk Hospital',
        address: 'Kondotty, Malappuram, Kerala 673638',
        latitude: 11.1456,
        longitude: 75.9678
      },
      {
        name: 'Nilambur Govt Hospital',
        address: 'Nilambur, Malappuram, Kerala 679329',
        latitude: 11.2756,
        longitude: 76.2267
      }
    ];

    // ========================================================================
    // CLINICS - Kozhikode & Malappuram Districts (10 clinics)
    // ========================================================================
    const clinicsData = [
      // Kozhikode Clinics
      {
        name: 'Heartline Cardiac Clinic',
        address: 'Mavoor Road, Kozhikode, Kerala 673004',
        latitude: 11.2534,
        longitude: 75.7812
      },
      {
        name: 'Dermacare Skin Clinic',
        address: 'SM Street, Kozhikode, Kerala 673001',
        latitude: 11.2498,
        longitude: 75.7756
      },
      {
        name: 'Orthoplus Bone & Joint Clinic',
        address: 'Palayam, Kozhikode, Kerala 673002',
        latitude: 11.2567,
        longitude: 75.7789
      },
      {
        name: 'Smiley Dental Care',
        address: 'Kallai, Kozhikode, Kerala 673003',
        latitude: 11.2612,
        longitude: 75.7834
      },
      {
        name: 'Visionmax Eye Clinic',
        address: 'Mofussil, Kozhikode, Kerala 673001',
        latitude: 11.2478,
        longitude: 75.7723
      },
      // Malappuram Clinics
      {
        name: 'Neurolife Brain & Spine Clinic',
        address: 'Malappuram Town, Kerala 676505',
        latitude: 11.0456,
        longitude: 76.0823
      },
      {
        name: 'Pediatrix Child Care Clinic',
        address: 'Perinthalmanna, Malappuram, Kerala 679322',
        latitude: 10.9789,
        longitude: 76.2189
      },
      {
        name: 'Breatheasy Pulmo Clinic',
        address: 'Manjeri, Malappuram, Kerala 676121',
        latitude: 11.1212,
        longitude: 76.1156
      },
      {
        name: 'Womens Care Clinic',
        address: 'Tirur, Malappuram, Kerala 676101',
        latitude: 10.9112,
        longitude: 75.9189
      },
      {
        name: 'Diabetocare Clinic',
        address: 'Kondotty, Malappuram, Kerala 673638',
        latitude: 11.1489,
        longitude: 75.9712
      }
    ];

    // Insert Hospitals
    const hospitals = [];
    for (const hosp of hospitalsData) {
      hospitals.push({
        hospital_id: nextHospitalId++,
        name: hosp.name,
        address: hosp.address,
        latitude: hosp.latitude,
        longitude: hosp.longitude,
        rush_level: 'low',
        updated_at: new Date()
      });
    }
    await Hospital.insertMany(hospitals);
    console.log(`✅ Created ${hospitals.length} hospitals (IDs ${
        hospitals[0].hospital_id} to ${
        hospitals[hospitals.length - 1].hospital_id})`);

    // Insert Clinics
    const clinics = [];
    for (const clinic of clinicsData) {
      clinics.push({
        clinic_id: nextClinicId++,
        name: clinic.name,
        address: clinic.address,
        latitude: clinic.latitude,
        longitude: clinic.longitude
      });
    }
    await Clinic.insertMany(clinics);
    console.log(`✅ Created ${clinics.length} clinics (IDs ${
        clinics[0].clinic_id} to ${clinics[clinics.length - 1].clinic_id})`);

    // ========================================================================
    // ADMIN USERS for hospitals and clinics
    // One admin per hospital (20) + one admin per clinic (10) = 30 admins
    // ========================================================================
    const adminUsers = [];
    const hospitalAdminLinks = [];

    // Hospital Admins (20)
    const hospitalAdminNames = [
      {first: 'Rahul', last: 'Menon'},     {first: 'Priya', last: 'Nair'},
      {first: 'Arun', last: 'Kumar'},      {first: 'Sreeja', last: 'Krishnan'},
      {first: 'Vishnu', last: 'Pillai'},   {first: 'Anjali', last: 'Mohan'},
      {first: 'Suresh', last: 'Babu'},     {first: 'Lakshmi', last: 'Devi'},
      {first: 'Manoj', last: 'Varma'},     {first: 'Divya', last: 'Raj'},
      {first: 'Abdul', last: 'Rahman'},    {first: 'Fathima', last: 'Beevi'},
      {first: 'Muhammed', last: 'Ashraf'}, {first: 'Ayisha', last: 'Siddique'},
      {first: 'Rashid', last: 'Ali'},      {first: 'Sajeeda', last: 'Hameed'},
      {first: 'Navas', last: 'Ibrahim'},   {first: 'Shameena', last: 'Basheer'},
      {first: 'Anwar', last: 'Sadiq'},     {first: 'Rizwana', last: 'Khalid'}
    ];

    for (let i = 0; i < hospitals.length; i++) {
      const adminName = hospitalAdminNames[i];
      const userId = nextUserId++;
      const hospital = hospitals[i];

      adminUsers.push({
        user_id: userId,
        first_name: adminName.first,
        last_name: adminName.last,
        username:
            `admin_${adminName.first.toLowerCase()}_${hospital.hospital_id}`,
        password_hash: 'test123',
        role: 'admin',
        email: `${adminName.first.toLowerCase()}.${
            adminName.last.toLowerCase()}@medsync.com`,
        phone: `94960${String(i + 10000).slice(-5)}`,
        date_of_birth:
            new Date(`198${i % 10}-0${(i % 9) + 1}-${10 + (i % 20)}`),
        gender: i % 2 === 0 ? 'male' : 'female',
        address: hospital.address,
        latitude: hospital.latitude,
        longitude: hospital.longitude,
        created_at: new Date()
      });

      hospitalAdminLinks.push({
        admin_id: userId,
        hospital_id: hospital.hospital_id,
        admin_type: 'hospital'
      });
    }

    // Clinic Admins (10)
    const clinicAdminNames = [
      {first: 'Deepak', last: 'Sharma'}, {first: 'Meera', last: 'Unni'},
      {first: 'Kiran', last: 'Thomas'}, {first: 'Nisha', last: 'Menon'},
      {first: 'Jithin', last: 'George'}, {first: 'Hasna', last: 'Beegum'},
      {first: 'Salim', last: 'Koya'}, {first: 'Ruksana', last: 'Fathima'},
      {first: 'Shibu', last: 'Mathew'}, {first: 'Amina', last: 'Thasni'}
    ];

    for (let i = 0; i < clinics.length; i++) {
      const adminName = clinicAdminNames[i];
      const userId = nextUserId++;
      const clinic = clinics[i];

      adminUsers.push({
        user_id: userId,
        first_name: adminName.first,
        last_name: adminName.last,
        username:
            `admin_${adminName.first.toLowerCase()}_clinic_${clinic.clinic_id}`,
        password_hash: 'test123',
        role: 'admin',
        email: `${adminName.first.toLowerCase()}.${
            adminName.last.toLowerCase()}.clinic@medsync.com`,
        phone: `94961${String(i + 10000).slice(-5)}`,
        date_of_birth:
            new Date(`199${i % 10}-0${(i % 9) + 1}-${10 + (i % 20)}`),
        gender: i % 2 === 0 ? 'male' : 'female',
        address: clinic.address,
        latitude: clinic.latitude,
        longitude: clinic.longitude,
        created_at: new Date()
      });

      hospitalAdminLinks.push({
        admin_id: userId,
        hospital_id: null,
        clinic_id: clinic.clinic_id,
        admin_type: 'clinic'
      });
    }

    // Insert Admin Users
    await User.insertMany(adminUsers);
    console.log(`✅ Created ${adminUsers.length} admin users (IDs ${
        adminUsers[0].user_id} to ${
        adminUsers[adminUsers.length - 1].user_id})`);

    // Insert Hospital/Clinic Admin Links
    await HospitalAdmin.insertMany(hospitalAdminLinks);
    console.log(`✅ Created ${hospitalAdminLinks.length} admin links (${
        hospitals.length} hospital admins + ${clinics.length} clinic admins)`);

    // Summary
    console.log('\n========================================');
    console.log('SEED COMPLETE - SUMMARY');
    console.log('========================================');
    console.log(`Total Hospitals Added: ${hospitals.length}`);
    console.log(`Total Clinics Added: ${clinics.length}`);
    console.log(`Total Admin Users Added: ${adminUsers.length}`);
    console.log(`All passwords: test123`);
    console.log('========================================\n');

    mongoose.connection.close();
    console.log('Database connection closed');

  } catch (err) {
    console.error('Error seeding database:', err);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedHospitalsAndClinics();
