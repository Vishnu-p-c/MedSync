const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Clinic = require('./models/Clinic');
const HospitalAdmin = require('./models/HospitalAdmin');
const Doctor = require('./models/Doctor');
const DoctorSchedule = require('./models/DoctorSchedule');

// ============================================================================
// HELPERS
// ============================================================================
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomItems = (arr, min, max) => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  return [...arr]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(count, arr.length));
};
const rushLevels = ['low', 'medium', 'high', 'critical'];
const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const morningSlots = [
  {start: '08:00', end: '12:00'}, {start: '08:30', end: '12:30'},
  {start: '09:00', end: '13:00'}, {start: '09:30', end: '13:30'},
  {start: '10:00', end: '14:00'}
];
const afternoonSlots = [
  {start: '13:00', end: '17:00'}, {start: '14:00', end: '18:00'},
  {start: '13:30', end: '17:30'}, {start: '14:30', end: '18:30'},
  {start: '15:00', end: '19:00'}
];
const eveningSlots = [
  {start: '17:00', end: '20:00'}, {start: '17:30', end: '20:30'},
  {start: '18:00', end: '21:00'}, {start: '18:30', end: '21:30'},
  {start: '19:00', end: '21:00'}
];
const departments = [
  'Cardiology',    'Neurology',    'Orthopedics',      'Gynecology',
  'Pediatrics',    'Dermatology',  'Ophthalmology',    'ENT',
  'Psychiatry',    'Urology',      'Nephrology',       'Gastroenterology',
  'Pulmonology',   'Oncology',     'General Medicine', 'General Surgery',
  'Endocrinology', 'Rheumatology', 'Radiology',        'Anesthesiology'
];
const qualificationSets = [
  ['MBBS', 'MD'], ['MBBS', 'MS'], ['MBBS', 'DM'], ['MBBS', 'MCh'],
  ['MBBS', 'DNB'], ['MBBS', 'MD', 'DM'], ['MBBS', 'MS', 'MCh'],
  ['MBBS', 'FRCS'], ['MBBS', 'MRCP'], ['MBBS', 'MD', 'DNB']
];

function randomSchedule(isClinic) {
  const numDays = Math.floor(Math.random() * 3) + (isClinic ? 2 : 3);
  const days = [...weekdays, 'saturday']
                   .sort(() => 0.5 - Math.random())
                   .slice(0, numDays);
  return days.map(day => {
    const pool = isClinic ?
        eveningSlots :
        (Math.random() > 0.5 ? morningSlots : afternoonSlots);
    const t = getRandom(pool);
    return {
      day,
      start: t.start,
      end: t.end,
      slot_duration: 30,
      max_patients: Math.floor(Math.random() * 3) + 3
    };
  });
}

// ============================================================================
// DATA - 50 KOCHI HOSPITALS
// ============================================================================
const hospitalsData = [
  // Ernakulam City Centre / MG Road / Broadway
  {
    name: 'Lisie Hospital',
    address: 'Lisie Junction, Ernakulam, Kochi 682018',
    lat: 9.9920,
    lon: 76.2960
  },
  {
    name: 'Medical Trust Hospital',
    address: 'MG Road, Ernakulam, Kochi 682016',
    lat: 9.9712,
    lon: 76.2850
  },
  {
    name: 'General Hospital Ernakulam',
    address: 'Hospital Road, Ernakulam, Kochi 682011',
    lat: 9.9689,
    lon: 76.2889
  },
  {
    name: 'Specialist Hospital Ernakulam',
    address: 'Shanmugham Road, Ernakulam, Kochi 682031',
    lat: 9.9745,
    lon: 76.2867
  },
  {
    name: 'SH Medical Centre',
    address: 'Market Road, Ernakulam, Kochi 682035',
    lat: 9.9750,
    lon: 76.2810
  },
  {
    name: 'Malabar Hospital Ernakulam',
    address: 'Banerji Road, Ernakulam, Kochi 682018',
    lat: 9.9690,
    lon: 76.2801
  },
  // Kaloor / Kadavanthra
  {
    name: 'PVS Memorial Hospital',
    address: 'Kaloor, Kochi 682017',
    lat: 9.9878,
    lon: 76.2997
  },
  {
    name: 'Silverline Hospital Kaloor',
    address: 'Kaloor Junction, Kochi 682017',
    lat: 9.9889,
    lon: 76.2945
  },
  {
    name: 'Omega Hospital',
    address: 'Thaikoodam, Kochi 682020',
    lat: 9.9612,
    lon: 76.2978
  },
  {
    name: 'Kadavanthra Hospital',
    address: 'Kadavanthra, Kochi 682020',
    lat: 9.9634,
    lon: 76.2923
  },
  // Palarivattom / Edappally / Cheranalloor
  {
    name: 'Ernakulam Medical Centre',
    address: 'Palarivattom, Kochi 682025',
    lat: 9.9815,
    lon: 76.3048
  },
  {
    name: 'Renai Medicity',
    address: 'Palarivattom, Kochi 682025',
    lat: 9.9844,
    lon: 76.3078
  },
  {
    name: 'SUT Hospital Kochi',
    address: 'Palarivattom, Kochi 682025',
    lat: 9.9834,
    lon: 76.3056
  },
  {
    name: 'Aster Medcity',
    address: 'Cheranalloor, Kochi 682027',
    lat: 10.0025,
    lon: 76.3023
  },
  {
    name: 'KMC Specialty Hospital Edappally',
    address: 'Edappally, Kochi 682024',
    lat: 10.0012,
    lon: 76.3045
  },
  {
    name: 'Trinity Hospital Edappally',
    address: 'Edappally Junction, Kochi 682024',
    lat: 10.0034,
    lon: 76.3067
  },
  // Ponekkara / AIMS Area
  {
    name: 'Amrita Institute of Medical Sciences',
    address: 'Ponekkara, Kochi 682041',
    lat: 9.9411,
    lon: 76.2879
  },
  // Vytilla / Thevara / Panampilly Nagar
  {
    name: 'Medicare Hospital Vytilla',
    address: 'Vytilla, Kochi 682019',
    lat: 9.9567,
    lon: 76.3156
  },
  {
    name: 'NS Memorial Institute',
    address: 'Thevara, Kochi 682013',
    lat: 9.9345,
    lon: 76.3090
  },
  {
    name: 'Star Hospital Thevara',
    address: 'Thevara Junction, Kochi 682013',
    lat: 9.9367,
    lon: 76.3056
  },
  // Maradu / South
  {
    name: 'VPS Lakeshore Hospital',
    address: 'NH 47 Bypass, Maradu, Kochi 682304',
    lat: 9.9328,
    lon: 76.3012
  },
  // Thrippunithura
  {
    name: 'Devi Hospital Thrippunithura',
    address: 'Thrippunithura, Kochi 682301',
    lat: 9.9378,
    lon: 76.3423
  },
  {
    name: 'Royal Hospital Thrippunithura',
    address: 'Hill Palace Road, Thrippunithura, Kochi 682301',
    lat: 9.9402,
    lon: 76.3389
  },
  {
    name: 'Westfort Hospital Thrippunithura',
    address: 'Palace Road, Thrippunithura, Kochi 682301',
    lat: 9.9356,
    lon: 76.3445
  },
  // Kakkanad / Smart City Area
  {
    name: 'Sunrise Hospital Kakkanad',
    address: 'Kakkanad, Kochi 682030',
    lat: 10.0089,
    lon: 76.3456
  },
  {
    name: 'Indo-American Hospital',
    address: 'Vazhakkala, Kakkanad, Kochi 682030',
    lat: 10.0134,
    lon: 76.3534
  },
  {
    name: 'Peoples Hospital Kakkanad',
    address: 'Kakkanad, Kochi 682030',
    lat: 10.0156,
    lon: 76.3489
  },
  // Kalamassery
  {
    name: 'Government Medical College Kochi',
    address: 'Kalamassery, Kochi 682022',
    lat: 10.0420,
    lon: 76.3180
  },
  {
    name: 'Kinder Hospital Kalamassery',
    address: 'Kalamassery, Kochi 682022',
    lat: 10.0345,
    lon: 76.3234
  },
  {
    name: 'ESI Hospital Udyogamandal',
    address: 'Udyogamandal, Kochi 683501',
    lat: 10.0478,
    lon: 76.2789
  },
  // Aluva
  {
    name: 'Rajagiri Hospital',
    address: 'Chunangamvely, Aluva, Kochi 683112',
    lat: 10.0604,
    lon: 76.3213
  },
  {
    name: 'Sarita Hospital Aluva',
    address: 'Aluva, Kochi 683101',
    lat: 10.1078,
    lon: 76.3530
  },
  {
    name: 'Bishop Vayalil Medical Centre',
    address: 'Aluva, Kochi 683101',
    lat: 10.1023,
    lon: 76.3567
  },
  {
    name: 'Sree Narayana Hospital Aluva',
    address: 'Aluva, Kochi 683101',
    lat: 10.1089,
    lon: 76.3489
  },
  {
    name: 'Bethesda Hospital Aluva',
    address: 'Aluva, Kochi 683101',
    lat: 10.1045,
    lon: 76.3512
  },
  {
    name: 'NIMS Hospital Aluva',
    address: 'Aluva, Kochi 683101',
    lat: 10.1112,
    lon: 76.3478
  },
  {
    name: 'District Hospital Aluva',
    address: 'Aluva Town, Kochi 683101',
    lat: 10.1067,
    lon: 76.3534
  },
  // Angamaly
  {
    name: 'Apollo Adlux Hospital',
    address: 'Angamaly, Kochi 683572',
    lat: 10.1867,
    lon: 76.3856
  },
  {
    name: 'Little Flower Hospital Angamaly',
    address: 'Angamaly, Kochi 683572',
    lat: 10.1912,
    lon: 76.3789
  },
  {
    name: 'Fatima Hospital Angamaly',
    address: 'Angamaly Town, Kochi 683572',
    lat: 10.1889,
    lon: 76.3812
  },
  {
    name: 'Cooperative Hospital Angamaly',
    address: 'Angamaly, Kochi 683572',
    lat: 10.1845,
    lon: 76.3834
  },
  // Perumbavoor
  {
    name: 'Grace Hospital Perumbavoor',
    address: 'Perumbavoor, Kochi 683542',
    lat: 10.1078,
    lon: 76.4756
  },
  {
    name: 'Taluk Hospital Perumbavoor',
    address: 'Perumbavoor Town, Kochi 683542',
    lat: 10.1123,
    lon: 76.4678
  },
  // Kolenchery / East
  {
    name: 'MOSC Medical College Hospital',
    address: 'Kolenchery, Kochi 682311',
    lat: 9.9012,
    lon: 76.4012
  },
  {
    name: 'Mother Hospital Thrikkakara',
    address: 'Thrikkakara, Kochi 682021',
    lat: 10.0234,
    lon: 76.3345
  },
  // Fort Kochi / Mattancherry / West
  {
    name: 'Cochin Port Trust Hospital',
    address: 'Willingdon Island, Kochi 682003',
    lat: 9.9678,
    lon: 76.2678
  },
  {
    name: 'City Hospital Fort Kochi',
    address: 'Fort Kochi, Kochi 682001',
    lat: 9.9645,
    lon: 76.2456
  },
  {
    name: 'West Kochi General Hospital',
    address: 'Thoppumpady, Kochi 682005',
    lat: 9.9534,
    lon: 76.2600
  },
  // North Paravur
  {
    name: 'Jubilee Hospital North Paravur',
    address: 'North Paravur, Kochi 683513',
    lat: 10.1456,
    lon: 76.2234
  },
  // Chellanam / South coastal
  {
    name: 'Coastal Hospital Chellanam',
    address: 'Chellanam, Kochi 682006',
    lat: 9.8934,
    lon: 76.2678
  },
];

// ============================================================================
// DATA - 50 KOCHI CLINICS
// ============================================================================
const clinicsData = [
  // Ernakulam City
  {
    name: 'Heartline Cardiac Clinic',
    address: 'MG Road, Ernakulam, Kochi 682016',
    lat: 9.9723,
    lon: 76.2856
  },
  {
    name: 'DermaZone Skin Clinic',
    address: 'Broadway, Ernakulam, Kochi 682011',
    lat: 9.9690,
    lon: 76.2830
  },
  {
    name: 'MindCare Psychiatry Clinic',
    address: 'MG Road, Ernakulam, Kochi 682016',
    lat: 9.9734,
    lon: 76.2867
  },
  {
    name: 'SkinGlow Aesthetic Clinic',
    address: 'Shanmugham Road, Kochi 682031',
    lat: 9.9701,
    lon: 76.2834
  },
  {
    name: 'DiabetoCare Clinic',
    address: 'Hospital Road, Ernakulam, Kochi 682011',
    lat: 9.9690,
    lon: 76.2812
  },
  {
    name: 'AllergyFree Clinic',
    address: 'Convent Road, Ernakulam, Kochi 682035',
    lat: 9.9734,
    lon: 76.2856
  },
  {
    name: 'RheumaPlus Clinic',
    address: 'MG Road, Ernakulam, Kochi 682016',
    lat: 9.9712,
    lon: 76.2878
  },
  // Kaloor / Kadavanthra
  {
    name: 'OrthoOne Bone & Joint Clinic',
    address: 'Kaloor, Kochi 682017',
    lat: 9.9890,
    lon: 76.2978
  },
  {
    name: 'GastroPlus Clinic',
    address: 'Kaloor, Kochi 682017',
    lat: 9.9867,
    lon: 76.2989
  },
  {
    name: 'ENT Specialists Clinic',
    address: 'Kaloor, Kochi 682017',
    lat: 9.9901,
    lon: 76.2956
  },
  {
    name: 'OptiVision Laser Eye Centre',
    address: 'Kaloor, Kochi 682017',
    lat: 9.9878,
    lon: 76.2967
  },
  {
    name: 'HearWell Audiology Clinic',
    address: 'Kaloor, Kochi 682017',
    lat: 9.9912,
    lon: 76.2934
  },
  {
    name: 'VascularPro Clinic',
    address: 'Kaloor, Kochi 682017',
    lat: 9.9878,
    lon: 76.2990
  },
  {
    name: 'BloodCount Haematology Clinic',
    address: 'Kaloor, Kochi 682017',
    lat: 9.9889,
    lon: 76.2967
  },
  // Palarivattom
  {
    name: 'ClearVision Eye Clinic',
    address: 'Palarivattom, Kochi 682025',
    lat: 9.9812,
    lon: 76.3034
  },
  {
    name: 'UroLife Urology Clinic',
    address: 'Palarivattom, Kochi 682025',
    lat: 9.9823,
    lon: 76.3045
  },
  {
    name: 'OncoLife Cancer Clinic',
    address: 'Palarivattom, Kochi 682025',
    lat: 9.9845,
    lon: 76.3067
  },
  {
    name: 'CosmetiDerm Clinic',
    address: 'Palarivattom, Kochi 682025',
    lat: 9.9834,
    lon: 76.3056
  },
  {
    name: 'FertilityFirst IVF Clinic',
    address: 'Palarivattom, Kochi 682025',
    lat: 9.9823,
    lon: 76.3034
  },
  {
    name: 'OrthoPrime Sports Clinic',
    address: 'Palarivattom, Kochi 682025',
    lat: 9.9812,
    lon: 76.3045
  },
  // Edappally
  {
    name: 'SmileCraft Dental Clinic',
    address: 'Edappally, Kochi 682024',
    lat: 10.0023,
    lon: 76.3056
  },
  {
    name: 'WomenFirst Gynec Clinic',
    address: 'Edappally, Kochi 682024',
    lat: 10.0045,
    lon: 76.3078
  },
  {
    name: 'GastroVille Clinic',
    address: 'Edappally, Kochi 682024',
    lat: 10.0056,
    lon: 76.3089
  },
  {
    name: 'PainRelief Clinic Edappally',
    address: 'Edappally, Kochi 682024',
    lat: 10.0034,
    lon: 76.3067
  },
  // Kakkanad
  {
    name: 'NeuroElite Brain Clinic',
    address: 'Kakkanad, Kochi 682030',
    lat: 10.0112,
    lon: 76.3467
  },
  {
    name: 'NephroPlus Kidney Clinic',
    address: 'Kakkanad, Kochi 682030',
    lat: 10.0134,
    lon: 76.3490
  },
  {
    name: 'BabySquad Child Clinic',
    address: 'Kakkanad, Kochi 682030',
    lat: 10.0178,
    lon: 76.3512
  },
  {
    name: 'SkinAura Dermatology',
    address: 'Kakkanad, Kochi 682030',
    lat: 10.0123,
    lon: 76.3478
  },
  // Thevara / Panampilly Nagar
  {
    name: 'PediaCare Child Clinic',
    address: 'Thevara, Kochi 682013',
    lat: 9.9356,
    lon: 76.3078
  },
  {
    name: 'ArthritisCare Clinic',
    address: 'Thevara, Kochi 682013',
    lat: 9.9378,
    lon: 76.3045
  },
  {
    name: 'UroCare Clinic Thevara',
    address: 'Thevara, Kochi 682013',
    lat: 9.9345,
    lon: 76.3078
  },
  // Thrippunithura
  {
    name: 'PhysioHealth Rehab Clinic',
    address: 'Thrippunithura, Kochi 682301',
    lat: 9.9389,
    lon: 76.3412
  },
  {
    name: 'EndoCare Diabetes Clinic',
    address: 'Thrippunithura, Kochi 682301',
    lat: 9.9401,
    lon: 76.3401
  },
  {
    name: 'CardioPulse Clinic',
    address: 'Thrippunithura, Kochi 682301',
    lat: 9.9390,
    lon: 76.3410
  },
  // Vytilla
  {
    name: 'SpineWell Ortho Clinic',
    address: 'Vytilla, Kochi 682019',
    lat: 9.9578,
    lon: 76.3145
  },
  {
    name: 'MaxVision Eye Hospital',
    address: 'Vytilla, Kochi 682019',
    lat: 9.9556,
    lon: 76.3167
  },
  // Aluva
  {
    name: 'BreatheWell Pulmo Clinic',
    address: 'Aluva, Kochi 683101',
    lat: 10.1056,
    lon: 76.3523
  },
  {
    name: 'DentAlign Orthodontic Centre',
    address: 'Aluva, Kochi 683101',
    lat: 10.1034,
    lon: 76.3501
  },
  {
    name: 'EyeMasters Ophthalmology',
    address: 'Aluva, Kochi 683101',
    lat: 10.1067,
    lon: 76.3478
  },
  {
    name: 'JointCare Ortho Clinic',
    address: 'Aluva, Kochi 683101',
    lat: 10.1045,
    lon: 76.3545
  },
  // Kalamassery
  {
    name: 'KidsCare Pediatric Clinic',
    address: 'Kalamassery, Kochi 682022',
    lat: 10.0356,
    lon: 76.3212
  },
  {
    name: 'NeuroVita Clinic',
    address: 'Kalamassery, Kochi 682022',
    lat: 10.0378,
    lon: 76.3234
  },
  // Angamaly
  {
    name: 'MotherCare Maternity Clinic',
    address: 'Angamaly, Kochi 683572',
    lat: 10.1878,
    lon: 76.3823
  },
  {
    name: 'LungCare Pulmonology Clinic',
    address: 'Angamaly, Kochi 683572',
    lat: 10.1856,
    lon: 76.3801
  },
  // Perumbavoor
  {
    name: 'PulmoLife Chest Clinic',
    address: 'Perumbavoor, Kochi 683542',
    lat: 10.1089,
    lon: 76.4734
  },
  {
    name: 'HealthBridge Family Clinic',
    address: 'Perumbavoor, Kochi 683542',
    lat: 10.1101,
    lon: 76.4745
  },
  // Fort Kochi / Mattancherry
  {
    name: 'PhysioPlus Rehab Centre',
    address: 'Fort Kochi, Kochi 682001',
    lat: 9.9656,
    lon: 76.2423
  },
  {
    name: 'DentalHub Multi Speciality',
    address: 'Fort Kochi, Kochi 682001',
    lat: 9.9634,
    lon: 76.2445
  },
  {
    name: 'MedFirst Primary Care',
    address: 'Mattancherry, Kochi 682002',
    lat: 9.9523,
    lon: 76.2567
  },
  // North Paravur
  {
    name: 'GynCare Women\'s Clinic',
    address: 'North Paravur, Kochi 683513',
    lat: 10.1434,
    lon: 76.2212
  },
];

// ============================================================================
// ADMIN NAMES (100 unique — 50 for hospitals, 50 for clinics)
// ============================================================================
const adminNames = [
  // Hospital admins (50)
  {f: 'Rahul', l: 'Menon'},
  {f: 'Priya', l: 'Nair'},
  {f: 'Arun', l: 'Kumar'},
  {f: 'Sreeja', l: 'Krishnan'},
  {f: 'Vishnu', l: 'Pillai'},
  {f: 'Anjali', l: 'Mohan'},
  {f: 'Suresh', l: 'Babu'},
  {f: 'Lakshmi', l: 'Devi'},
  {f: 'Manoj', l: 'Varma'},
  {f: 'Divya', l: 'Raj'},
  {f: 'Abdul', l: 'Rahman'},
  {f: 'Fathima', l: 'Beevi'},
  {f: 'Muhammed', l: 'Ashraf'},
  {f: 'Ayisha', l: 'Siddique'},
  {f: 'Rashid', l: 'Ali'},
  {f: 'Sajeeda', l: 'Hameed'},
  {f: 'Navas', l: 'Ibrahim'},
  {f: 'Shameena', l: 'Basheer'},
  {f: 'Anwar', l: 'Sadiq'},
  {f: 'Rizwana', l: 'Khalid'},
  {f: 'Jobin', l: 'Thomas'},
  {f: 'Tessy', l: 'Joseph'},
  {f: 'Shibu', l: 'Mathew'},
  {f: 'Rosemary', l: 'George'},
  {f: 'Jithin', l: 'Philip'},
  {f: 'Reema', l: 'Das'},
  {f: 'Sandeep', l: 'Nambiar'},
  {f: 'Veena', l: 'Iyer'},
  {f: 'Aswin', l: 'Thampi'},
  {f: 'Neethu', l: 'Shankar'},
  {f: 'Kiran', l: 'Rajan'},
  {f: 'Ammu', l: 'Krishna'},
  {f: 'Sooraj', l: 'Pillai'},
  {f: 'Roshni', l: 'Menon'},
  {f: 'Nitin', l: 'Shenoy'},
  {f: 'Pooja', l: 'Kamath'},
  {f: 'Varun', l: 'Unni'},
  {f: 'Gayathri', l: 'Warrier'},
  {f: 'Sachin', l: 'Pai'},
  {f: 'Aparna', l: 'Bhat'},
  {f: 'Arjun', l: 'Prasad'},
  {f: 'Meghna', l: 'Suresh'},
  {f: 'Nithin', l: 'Madhav'},
  {f: 'Saritha', l: 'Vijay'},
  {f: 'Hari', l: 'Krishnan'},
  {f: 'Remya', l: 'Nair'},
  {f: 'Dileep', l: 'Panicker'},
  {f: 'Tincy', l: 'Mathew'},
  {f: 'Jomon', l: 'Kurian'},
  {f: 'Simi', l: 'Varghese'},
  // Clinic admins (50)
  {f: 'Deepak', l: 'Sharma'},
  {f: 'Meera', l: 'Unni'},
  {f: 'Nisha', l: 'Menon'},
  {f: 'Hasna', l: 'Beegum'},
  {f: 'Salim', l: 'Koya'},
  {f: 'Ruksana', l: 'Fathima'},
  {f: 'Amina', l: 'Thasni'},
  {f: 'Vinu', l: 'Mathew'},
  {f: 'Sanal', l: 'Kumar'},
  {f: 'Bindu', l: 'Pillai'},
  {f: 'Sajith', l: 'Nair'},
  {f: 'Smitha', l: 'Nambiar'},
  {f: 'Rajeev', l: 'Chandran'},
  {f: 'Lekha', l: 'Mohan'},
  {f: 'Anish', l: 'George'},
  {f: 'Rekha', l: 'Das'},
  {f: 'Prasanth', l: 'Raju'},
  {f: 'Soumya', l: 'Krishnan'},
  {f: 'Shaiju', l: 'Thomas'},
  {f: 'Jincy', l: 'Joseph'},
  {f: 'Amal', l: 'Dev'},
  {f: 'Athira', l: 'Vijayan'},
  {f: 'Bibin', l: 'Paul'},
  {f: 'Chinnu', l: 'Philip'},
  {f: 'Dinu', l: 'Rajan'},
  {f: 'Elsa', l: 'Varghese'},
  {f: 'Faizal', l: 'Hasan'},
  {f: 'Geethu', l: 'Nair'},
  {f: 'Hashim', l: 'Ahmed'},
  {f: 'Irene', l: 'Thomas'},
  {f: 'Jaison', l: 'John'},
  {f: 'Kavya', l: 'Menon'},
  {f: 'Libin', l: 'Kurian'},
  {f: 'Manju', l: 'Warrier'},
  {f: 'Noufal', l: 'Rasheed'},
  {f: 'Parvathy', l: 'Iyer'},
  {f: 'Raees', l: 'Mohammed'},
  {f: 'Santhosh', l: 'Babu'},
  {f: 'Thaha', l: 'Ali'},
  {f: 'Uma', l: 'Devi'},
  {f: 'Vineet', l: 'Kumar'},
  {f: 'Wahida', l: 'Salim'},
  {f: 'Xavier', l: 'Antony'},
  {f: 'Yamini', l: 'Raj'},
  {f: 'Zainab', l: 'Ibrahim'},
  {f: 'Ajay', l: 'Suresh'},
  {f: 'Bhavya', l: 'Pillai'},
  {f: 'Chandni', l: 'Mohan'},
  {f: 'Daya', l: 'Krishnan'},
  {f: 'Edwin', l: 'George'},
];

// ============================================================================
// DOCTOR NAMES (120 unique for ~120 doctors)
// ============================================================================
const doctorNames = [
  {f: 'Aravind', l: 'Menon'},      {f: 'Suresh', l: 'Nair'},
  {f: 'Rajesh', l: 'Kumar'},       {f: 'Vinod', l: 'Pillai'},
  {f: 'Mohan', l: 'Das'},          {f: 'Anoop', l: 'Krishnan'},
  {f: 'Sanjay', l: 'Varma'},       {f: 'Deepak', l: 'Nambiar'},
  {f: 'Manoj', l: 'Thampi'},       {f: 'Prasad', l: 'Iyer'},
  {f: 'Abdul', l: 'Rasheed'},      {f: 'Mohammed', l: 'Fazil'},
  {f: 'Shameer', l: 'Ali'},        {f: 'Navas', l: 'Koya'},
  {f: 'Rashid', l: 'Hasan'},       {f: 'Shibu', l: 'Mathew'},
  {f: 'Thomas', l: 'Varghese'},    {f: 'George', l: 'Philip'},
  {f: 'Joseph', l: 'Antony'},      {f: 'Biju', l: 'Kurian'},
  {f: 'Lakshmi', l: 'Devi'},       {f: 'Priya', l: 'Menon'},
  {f: 'Anjali', l: 'Nair'},        {f: 'Divya', l: 'Pillai'},
  {f: 'Sreeja', l: 'Kumar'},       {f: 'Meera', l: 'Krishnan'},
  {f: 'Deepa', l: 'Mohan'},        {f: 'Sunitha', l: 'Raj'},
  {f: 'Remya', l: 'Suresh'},       {f: 'Nisha', l: 'Thomas'},
  {f: 'Fathima', l: 'Beevi'},      {f: 'Ayisha', l: 'Siddique'},
  {f: 'Shameena', l: 'Basheer'},   {f: 'Rizwana', l: 'Khalid'},
  {f: 'Safiya', l: 'Rahman'},      {f: 'Tessy', l: 'Joseph'},
  {f: 'Mary', l: 'Thomas'},        {f: 'Rose', l: 'Philip'},
  {f: 'Smitha', l: 'Nambiar'},     {f: 'Asha', l: 'Menon'},
  {f: 'Vijay', l: 'Shankar'},      {f: 'Ramesh', l: 'Babu'},
  {f: 'Geetha', l: 'Krishnan'},    {f: 'Kavitha', l: 'Nair'},
  {f: 'Sathish', l: 'Kumar'},      {f: 'Rajeev', l: 'Rajan'},
  {f: 'Sandra', l: 'George'},      {f: 'Anil', l: 'Varma'},
  {f: 'Bindu', l: 'Warrier'},      {f: 'Cibi', l: 'Mathew'},
  {f: 'Dhanesh', l: 'Nair'},       {f: 'Elsa', l: 'Joseph'},
  {f: 'Firoz', l: 'Ahmed'},        {f: 'Gopika', l: 'Das'},
  {f: 'Harish', l: 'Menon'},       {f: 'Indira', l: 'Pillai'},
  {f: 'Jabir', l: 'Mohammed'},     {f: 'Karthika', l: 'Unni'},
  {f: 'Lijo', l: 'Thomas'},        {f: 'Mridula', l: 'Krishnan'},
  {f: 'Naveen', l: 'Shenoy'},      {f: 'Omana', l: 'Kumari'},
  {f: 'Prajith', l: 'Raju'},       {f: 'Queency', l: 'Mathew'},
  {f: 'Rohit', l: 'Menon'},        {f: 'Sowmya', l: 'Iyer'},
  {f: 'Tinu', l: 'Varghese'},      {f: 'Usha', l: 'Nair'},
  {f: 'Vivek', l: 'Chandran'},     {f: 'Wafa', l: 'Salam'},
  {f: 'Yadhu', l: 'Krishnan'},     {f: 'Zeena', l: 'Ali'},
  {f: 'Akash', l: 'Pillai'},       {f: 'Beena', l: 'Das'},
  {f: 'Chinmay', l: 'Nambiar'},    {f: 'Deepthi', l: 'Mohan'},
  {f: 'Ebin', l: 'George'},        {f: 'Femina', l: 'Ibrahim'},
  {f: 'Girish', l: 'Pai'},         {f: 'Hema', l: 'Warrier'},
  {f: 'Irfan', l: 'Khan'},         {f: 'Jisha', l: 'Kumari'},
  {f: 'Krishnadev', l: 'Menon'},   {f: 'Latha', l: 'Nair'},
  {f: 'Mithun', l: 'Thomas'},      {f: 'Neena', l: 'Philip'},
  {f: 'Oommen', l: 'Kurian'},      {f: 'Padma', l: 'Iyer'},
  {f: 'Raghav', l: 'Kumar'},       {f: 'Sreelakshmi', l: 'Pillai'},
  {f: 'Tharun', l: 'Nair'},        {f: 'Ushadevi', l: 'Menon'},
  {f: 'Vaishakh', l: 'Krishna'},   {f: 'Wilma', l: 'George'},
  {f: 'Yaseen', l: 'Rasheed'},     {f: 'Zubaida', l: 'Hasan'},
  {f: 'Adithya', l: 'Varma'},      {f: 'Bhagyalakshmi', l: 'Nair'},
  {f: 'Christy', l: 'Thomas'},     {f: 'Dhanya', l: 'Raj'},
  {f: 'Eldho', l: 'Joseph'},       {f: 'Farisha', l: 'Ali'},
  {f: 'Ganesh', l: 'Kumar'},       {f: 'Haseena', l: 'Beevi'},
  {f: 'Ismail', l: 'Koya'},        {f: 'Jyothi', l: 'Devi'},
  {f: 'Kiran', l: 'Menon'},        {f: 'Lisamma', l: 'Varghese'},
  {f: 'Midhun', l: 'Pillai'},      {f: 'Nandini', l: 'Das'},
  {f: 'Praveen', l: 'Nambiar'},    {f: 'Reshmi', l: 'Mohan'},
  {f: 'Sajeesh', l: 'Nair'},       {f: 'Theertha', l: 'Krishna'},
  {f: 'Unnikrishnan', l: 'Menon'}, {f: 'Vidya', l: 'Kumari'},
  {f: 'Ajith', l: 'Prasad'},       {f: 'Sindhu', l: 'Warrier'},
  {f: 'Divin', l: 'Mathew'},       {f: 'Amritha', l: 'Nair'},
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
const seedKochi = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB Connected');

    // Hash password once
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('pass123', salt);
    console.log('Password hashed');

    // Get highest existing IDs
    const lastUser = await User.findOne().sort({user_id: -1}).lean();
    const lastHospital =
        await Hospital.findOne().sort({hospital_id: -1}).lean();
    const lastClinic = await Clinic.findOne().sort({clinic_id: -1}).lean();
    const lastDoctor = await Doctor.findOne().sort({doctor_id: -1}).lean();

    let nextUserId = lastUser ? lastUser.user_id + 1 : 1;
    let nextHospitalId = lastHospital ? lastHospital.hospital_id + 1 : 1;
    let nextClinicId = lastClinic ? lastClinic.clinic_id + 1 : 1;
    let nextDoctorId = lastDoctor ? lastDoctor.doctor_id + 1 : 1;

    console.log(`Starting IDs → User: ${nextUserId}, Hospital: ${
        nextHospitalId}, Clinic: ${nextClinicId}, Doctor: ${nextDoctorId}`);

    // ========================================================================
    // 1. INSERT HOSPITALS (50)
    // ========================================================================
    const hospitals = hospitalsData.map(
        (h, i) => ({
          hospital_id: nextHospitalId + i,
          name: h.name,
          address: h.address,
          latitude: h.lat,
          longitude: h.lon,
          rush_level:
              rushLevels[i % rushLevels.length],  // cycles: low, medium, high,
                                                  // critical
          default_schedule: randomSchedule(false),
          updated_at: new Date()
        }));
    await Hospital.insertMany(hospitals);
    nextHospitalId += hospitals.length;
    console.log(`✅ ${hospitals.length} hospitals created (IDs ${
        hospitals[0].hospital_id}–${
        hospitals[hospitals.length - 1].hospital_id})`);

    // ========================================================================
    // 2. INSERT CLINICS (50)
    // ========================================================================
    const clinics = clinicsData.map((c, i) => ({
                                      clinic_id: nextClinicId + i,
                                      name: c.name,
                                      address: c.address,
                                      latitude: c.lat,
                                      longitude: c.lon,
                                      default_schedule: randomSchedule(true)
                                    }));
    await Clinic.insertMany(clinics);
    nextClinicId += clinics.length;
    console.log(`✅ ${clinics.length} clinics created (IDs ${
        clinics[0].clinic_id}–${clinics[clinics.length - 1].clinic_id})`);

    // ========================================================================
    // 3. CREATE ADMIN USERS + HOSPITAL ADMIN LINKS (50 hospital + 50 clinic)
    // ========================================================================
    const adminUsers = [];
    const hospitalAdminLinks = [];
    const genders = ['male', 'female'];

    // Hospital admins
    for (let i = 0; i < hospitals.length; i++) {
      const a = adminNames[i];
      const uid = nextUserId++;
      const hosp = hospitals[i];
      adminUsers.push({
        user_id: uid,
        first_name: a.f,
        last_name: a.l,
        username: `kochi_hadmin_${hosp.hospital_id}`,
        password_hash: passwordHash,
        role: 'admin',
        email: `${a.f.toLowerCase()}.${a.l.toLowerCase()}.h${
            hosp.hospital_id}@medsync.com`,
        phone: `98470${String(10000 + i).slice(-5)}`,
        date_of_birth: new Date(
            `${1975 + (i % 20)}-${String((i % 12) + 1).padStart(2, '0')}-${
                String((i % 28) + 1).padStart(2, '0')}`),
        gender: genders[i % 2],
        address: hosp.address,
        latitude: hosp.latitude,
        longitude: hosp.longitude,
        created_at: new Date()
      });
      hospitalAdminLinks.push({
        admin_id: uid,
        hospital_id: hosp.hospital_id,
        admin_type: 'hospital'
      });
    }

    // Clinic admins
    for (let i = 0; i < clinics.length; i++) {
      const a = adminNames[50 + i];
      const uid = nextUserId++;
      const cl = clinics[i];
      adminUsers.push({
        user_id: uid,
        first_name: a.f,
        last_name: a.l,
        username: `kochi_cadmin_${cl.clinic_id}`,
        password_hash: passwordHash,
        role: 'admin',
        email: `${a.f.toLowerCase()}.${a.l.toLowerCase()}.c${
            cl.clinic_id}@medsync.com`,
        phone: `98471${String(10000 + i).slice(-5)}`,
        date_of_birth: new Date(
            `${1978 + (i % 18)}-${String((i % 12) + 1).padStart(2, '0')}-${
                String((i % 28) + 1).padStart(2, '0')}`),
        gender: genders[(i + 1) % 2],
        address: cl.address,
        latitude: cl.latitude,
        longitude: cl.longitude,
        created_at: new Date()
      });
      hospitalAdminLinks.push({
        admin_id: uid,
        hospital_id: null,
        clinic_id: cl.clinic_id,
        admin_type: 'clinic'
      });
    }

    await User.insertMany(adminUsers);
    console.log(`✅ ${adminUsers.length} admin users created`);
    await HospitalAdmin.insertMany(hospitalAdminLinks);
    console.log(`✅ ${hospitalAdminLinks.length} admin links created`);

    // ========================================================================
    // 4. CREATE DOCTOR USERS + DOCTOR RECORDS + SCHEDULES (120 doctors)
    // ========================================================================
    const hospitalInfo =
        hospitals.map(h => ({id: h.hospital_id, name: h.name}));
    const clinicInfo = clinics.map(c => ({id: c.clinic_id, name: c.name}));
    const NUM_DOCTORS = 120;

    const doctorUsers = [];
    const doctorRecords = [];
    const doctorSchedules = [];

    for (let i = 0; i < NUM_DOCTORS; i++) {
      const n = doctorNames[i % doctorNames.length];
      const uid = nextUserId++;
      const did = nextDoctorId++;
      const dept = departments[i % departments.length];

      // Determine assignments
      let selHospitals = [];
      let selClinics = [];
      if (i < 30) {
        // Single hospital
        selHospitals = [hospitalInfo[i % hospitalInfo.length]];
      } else if (i < 50) {
        // Single clinic
        selClinics = [clinicInfo[i % clinicInfo.length]];
      } else if (i < 75) {
        // Hospital + clinic
        selHospitals = [hospitalInfo[i % hospitalInfo.length]];
        selClinics = [clinicInfo[i % clinicInfo.length]];
      } else if (i < 95) {
        // Multiple hospitals (2-3)
        selHospitals = getRandomItems(hospitalInfo, 2, 3);
      } else if (i < 110) {
        // Multiple clinics (2-3)
        selClinics = getRandomItems(clinicInfo, 2, 3);
      } else {
        // Multiple hospitals + clinics
        selHospitals = getRandomItems(hospitalInfo, 2, 3);
        selClinics = getRandomItems(clinicInfo, 1, 2);
      }

      const hospIds = selHospitals.map(h => h.id);
      const hospNames = selHospitals.map(h => h.name);
      const clIds = selClinics.map(c => c.id);
      const clNames = selClinics.map(c => c.name);
      const multiPlace = (hospIds.length + clIds.length) > 1;

      // User record
      doctorUsers.push({
        user_id: uid,
        first_name: n.f,
        last_name: n.l,
        username: `dr_${n.f.toLowerCase()}_${did}`,
        password_hash: passwordHash,
        role: 'doctor',
        email:
            `dr.${n.f.toLowerCase()}.${n.l.toLowerCase()}.${did}@medsync.com`,
        phone: `98472${String(10000 + i).slice(-5)}`,
        date_of_birth: new Date(
            `${1970 + (i % 25)}-${String((i % 12) + 1).padStart(2, '0')}-${
                String((i % 28) + 1).padStart(2, '0')}`),
        gender: i < 60 ? 'male' : 'female',
        address: `Kochi, Kerala`,
        latitude: 9.9312 + (Math.random() * 0.15),
        longitude: 76.2600 + (Math.random() * 0.15),
        created_at: new Date()
      });

      // Doctor record
      doctorRecords.push({
        doctor_id: did,
        hospital_id: hospIds.length > 0 ? hospIds : null,
        clinic_id: clIds.length > 0 ? clIds : null,
        first_name: n.f,
        last_name: n.l,
        name: `Dr. ${n.f} ${n.l}`,
        mrn: `KER${String(did).padStart(5, '0')}`,
        department: dept,
        is_available: true,
        last_attendance_time: null,
        multi_place: multiPlace,
        qualifications: getRandom(qualificationSets),
        hospitals: hospNames,
        clinics: clNames
      });

      // Build schedule
      const hospitalScheduleMap = {};
      const clinicScheduleMap = {};

      for (const h of selHospitals) {
        const numDays = Math.floor(Math.random() * 3) + 2;  // 2-4 days
        const days = getRandomItems(weekdays, numDays, numDays);
        const slots = days.map(day => {
          const t = Math.random() > 0.5 ? getRandom(morningSlots) :
                                          getRandom(afternoonSlots);
          return {
            day,
            start: t.start,
            end: t.end,
            slot_duration: 30,
            max_patients: Math.floor(Math.random() * 3) + 3
          };
        });
        hospitalScheduleMap[h.id.toString()] = {location_name: h.name, slots};
      }

      for (const c of selClinics) {
        const numDays = Math.floor(Math.random() * 2) + 1;  // 1-2 days
        const days =
            getRandomItems([...weekdays, 'saturday'], numDays, numDays);
        const slots = days.map(day => {
          const t = day === 'saturday' ? getRandom(morningSlots) :
                                         getRandom(eveningSlots);
          return {
            day,
            start: t.start,
            end: t.end,
            slot_duration: 30,
            max_patients: Math.floor(Math.random() * 2) + 2
          };
        });
        clinicScheduleMap[c.id.toString()] = {location_name: c.name, slots};
      }

      doctorSchedules.push({
        doctor_id: did,
        hospital_schedule: hospitalScheduleMap,
        clinic_schedule: clinicScheduleMap
      });
    }

    // Insert in batches to avoid dups
    await User.insertMany(doctorUsers);
    console.log(`✅ ${doctorUsers.length} doctor users created (User table)`);

    await Doctor.insertMany(doctorRecords);
    console.log(`✅ ${
        doctorRecords.length} doctor records created (DoctorDetails table)`);

    await DoctorSchedule.insertMany(doctorSchedules);
    console.log(`✅ ${
        doctorSchedules
            .length} doctor schedules created (DoctorSchedule table)`);

    // ========================================================================
    // SUMMARY
    // ========================================================================
    const onlyHosp = doctorRecords
                         .filter(
                             d => d.hospital_id && d.hospital_id.length > 0 &&
                                 (!d.clinic_id || d.clinic_id.length === 0))
                         .length;
    const onlyClinic =
        doctorRecords
            .filter(
                d => d.clinic_id && d.clinic_id.length > 0 &&
                    (!d.hospital_id || d.hospital_id.length === 0))
            .length;
    const both = doctorRecords
                     .filter(
                         d => d.hospital_id && d.hospital_id.length > 0 &&
                             d.clinic_id && d.clinic_id.length > 0)
                     .length;

    console.log('\n========================================');
    console.log('KOCHI SEED COMPLETE — SUMMARY');
    console.log('========================================');
    console.log(`Hospitals:       ${hospitals.length}`);
    console.log(`Clinics:         ${clinics.length}`);
    console.log(`Admin users:     ${adminUsers.length} (${
        hospitals.length} hospital + ${clinics.length} clinic)`);
    console.log(`Doctor users:    ${doctorUsers.length}`);
    console.log(`  Only Hospital: ${onlyHosp}`);
    console.log(`  Only Clinic:   ${onlyClinic}`);
    console.log(`  Both:          ${both}`);
    console.log(`Doctor schedules:${doctorSchedules.length}`);
    console.log(`Password for all: pass123`);
    console.log(`Rush levels:     cycling low→medium→high→critical`);
    console.log('========================================\n');

    mongoose.connection.close();
    console.log('Database connection closed');

  } catch (err) {
    console.error('❌ Error seeding Kochi data:', err);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedKochi();
