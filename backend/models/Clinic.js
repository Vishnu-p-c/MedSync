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
      start: {type: String, required: true},
      end: {type: String, required: true},
      slot_duration: {type: Number, default: 30},
      max_patients: {type: Number, default: 3}
    },
    {_id: false});

const clinicSchema = new mongoose.Schema({
  clinic_id: {type: Number, required: true, unique: true},
  name: {type: String, required: true, maxLength: 100},
  address: {type: String, maxLength: 255},
  latitude: {type: Number},
  longitude: {type: Number},
  // Default schedule for new doctors at this clinic (typically evening hours)
  default_schedule: {
    type: [defaultSlotSchema],
    default: [
      {
        day: 'monday',
        start: '17:00',
        end: '20:00',
        slot_duration: 30,
        max_patients: 3
      },
      {
        day: 'wednesday',
        start: '17:00',
        end: '20:00',
        slot_duration: 30,
        max_patients: 3
      },
      {
        day: 'saturday',
        start: '10:00',
        end: '14:00',
        slot_duration: 30,
        max_patients: 3
      }
    ]
  }
});

module.exports = mongoose.model('Clinic', clinicSchema);
