const mongoose = require('mongoose');

// Default schedule slot schema (embedded)
const defaultSlotSchema = new mongoose.Schema(
    {
      day: {
        type: String,
        required: true,
        enum: [
          'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
          'saturday'
        ]
      },
      start: {type: String, required: true},  // "09:00"
      end: {type: String, required: true},    // "17:00"
      slot_duration: {type: Number, default: 30},
      max_patients: {type: Number, default: 4}
    },
    {_id: false});

const hospitalSchema = new mongoose.Schema({
  hospital_id: {type: Number, required: true, unique: true},
  name: {type: String, required: true, maxLength: 100},
  address: {type: String, maxLength: 255},
  latitude: {type: Number},
  longitude: {type: Number},
  rush_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  // Default schedule for new doctors at this hospital
  default_schedule: {
    type: [defaultSlotSchema],
    default: [
      {
        day: 'monday',
        start: '09:00',
        end: '13:00',
        slot_duration: 30,
        max_patients: 4
      },
      {
        day: 'tuesday',
        start: '09:00',
        end: '13:00',
        slot_duration: 30,
        max_patients: 4
      },
      {
        day: 'wednesday',
        start: '09:00',
        end: '13:00',
        slot_duration: 30,
        max_patients: 4
      },
      {
        day: 'thursday',
        start: '09:00',
        end: '13:00',
        slot_duration: 30,
        max_patients: 4
      },
      {
        day: 'friday',
        start: '09:00',
        end: '13:00',
        slot_duration: 30,
        max_patients: 4
      }
    ]
  },
  updated_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Hospital', hospitalSchema);
