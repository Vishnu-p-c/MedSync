require('dotenv').config();
const mongoose = require('mongoose');

const DoctorDetails = require('./models/Doctor');

const randomMorningTimeToday = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(6, 0, 0, 0);
  const end = new Date(now);
  end.setHours(11, 0, 0, 0);
  const t = start.getTime() +
      Math.floor(Math.random() * (end.getTime() - start.getTime()));
  return new Date(t);
};

const toPlainAttendanceObject = (mapOrObj) => {
  if (!mapOrObj) return {};
  if (typeof mapOrObj.get === 'function') {
    const out = {};
    for (const [k, v] of mapOrObj.entries()) out[String(k)] = v;
    return out;
  }
  return {...mapOrObj};
};

const migrateDoctorAttendance = async () => {
  try {
    if (!process.env.MONGO_URL) {
      console.error('❌ Missing env var MONGO_URL');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB Connected');

    const doctors = await DoctorDetails.find({}).exec();
    console.log(`Found ${doctors.length} doctor records`);

    let modified = 0;

    for (const doctor of doctors) {
      const consultHospitals =
          Array.isArray(doctor.hospital_id) ? doctor.hospital_id : [];
      const existingAttendance =
          toPlainAttendanceObject(doctor.hospital_attendance);

      // Ensure name is populated
      const computedName =
          `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
      let changed = false;
      if ((!doctor.name || String(doctor.name).trim() === '') && computedName) {
        doctor.name = computedName;
        changed = true;
      }

      // If no hospitals, just ensure invariants
      if (consultHospitals.length === 0) {
        // If a doctor has no hospitals, set these to a safe state
        if (doctor.current_hospital_id !== null) {
          doctor.current_hospital_id = null;
          changed = true;
        }
        if (doctor.is_available !== false) {
          doctor.is_available = false;
          changed = true;
        }
        if (doctor.last_attendance_time !== null) {
          // keep as-is? set null to avoid confusing UI
          doctor.last_attendance_time = null;
          changed = true;
        }
        if (doctor.hospital_attendance &&
            Object.keys(existingAttendance).length > 0) {
          doctor.hospital_attendance = {};
          changed = true;
        }

        if (changed) {
          await doctor.save();
          modified++;
        }
        continue;
      }

      // Build target attendance object for all consulting hospitals
      const attendanceObj = {};
      for (const hid of consultHospitals) {
        const key = String(hid);
        const existing = existingAttendance[key];
        attendanceObj[key] = {
          last_marked_at: existing?.last_marked_at || randomMorningTimeToday(),
          is_available: Boolean(existing?.is_available)
        };
      }

      // Enforce single active hospital
      const currentKey = doctor.current_hospital_id !== null &&
              doctor.current_hospital_id !== undefined ?
          String(doctor.current_hospital_id) :
          null;

      let activeKey = null;
      if (currentKey && attendanceObj[currentKey]) {
        activeKey = currentKey;
      } else {
        // Pick first hospital marked available; else pick first consult
        // hospital
        const availableKeys =
            Object.keys(attendanceObj)
                .filter(k => attendanceObj[k].is_available === true);
        activeKey = availableKeys.length > 0 ? availableKeys[0] :
                                               String(consultHospitals[0]);
      }

      for (const key of Object.keys(attendanceObj)) {
        attendanceObj[key].is_available = (key === activeKey);
      }

      const activeHospitalIdNum = Number(activeKey);

      // Update root fields
      const shouldBeAvailable = true;
      const activeMarkedAt = attendanceObj[activeKey]?.last_marked_at || null;

      // Detect changes
      const oldAttendanceJson = JSON.stringify(existingAttendance);
      const newAttendanceJson = JSON.stringify(attendanceObj);
      if (oldAttendanceJson !== newAttendanceJson) {
        doctor.hospital_attendance = attendanceObj;
        changed = true;
      }

      if (doctor.current_hospital_id !== activeHospitalIdNum) {
        doctor.current_hospital_id = activeHospitalIdNum;
        changed = true;
      }

      if (doctor.is_available !== shouldBeAvailable) {
        doctor.is_available = shouldBeAvailable;
        changed = true;
      }

      // Set last_attendance_time if missing
      if (!doctor.last_attendance_time && activeMarkedAt) {
        doctor.last_attendance_time = activeMarkedAt;
        changed = true;
      }

      if (changed) {
        await doctor.save();
        modified++;
      }
    }

    console.log(`✅ Migration complete. Updated ${modified} doctor records.`);
    await mongoose.connection.close();
    console.log('Database connection closed');

  } catch (err) {
    console.error('❌ Error migrating doctor attendance:', err);
    try {
      await mongoose.connection.close();
    } catch (_) {
    }
    process.exit(1);
  }
};

migrateDoctorAttendance();
