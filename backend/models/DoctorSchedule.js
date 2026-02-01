const mongoose = require('mongoose');

// Schema for individual time slots
const slotSchema = new mongoose.Schema(
    {
      day: {
        type: String,
        required: true,
        enum: [
          'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
          'saturday'
        ]
      },
      start: {type: String, required: true},       // "09:00"
      end: {type: String, required: true},         // "13:00"
      slot_duration: {type: Number, default: 30},  // minutes
      max_patients: {type: Number, default: 4}     // per slot
    },
    {_id: false});

// Schema for location schedule (hospital or clinic)
const locationScheduleSchema = new mongoose.Schema(
    {location_name: {type: String, required: true}, slots: [slotSchema]},
    {_id: false});

// Main DoctorSchedule schema
const doctorScheduleSchema = new mongoose.Schema({
  doctor_id: {type: Number, required: true, unique: true, ref: 'DoctorDetails'},

  // Hospital schedules - Map of hospital_id (as string) → schedule
  hospital_schedule: {type: Map, of: locationScheduleSchema, default: {}},

  // Clinic schedules - Map of clinic_id (as string) → schedule
  clinic_schedule: {type: Map, of: locationScheduleSchema, default: {}}
});

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
